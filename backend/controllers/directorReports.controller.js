import { db } from '../db/db.js';
import { carduriClienti, cardFidelitate, user, comenzi, locatiiPublice, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, and, desc } from 'drizzle-orm';

// Raport de eficiență a programului de fidelitate:
// distribuția utilizatorilor pe niveluri de card, veniturile generate pe nivel și metricile de eficiență globală
export const getLoyaltyReport = async (req, res) => {
    try {
        const cardTypes = await db.select().from(cardFidelitate);

        // Distribuția utilizatorilor: câți utilizatori au fiecare tip de card și câte puncte au acumulat
        const userDistribution = await db
            .select({
                tipCard: carduriClienti.tipUnicCard,
                userCount: sql`COUNT(*)`.as('userCount'),
                totalPoints: sql`COALESCE(SUM(${carduriClienti.puncteAcumulate}), 0)`.as('totalPoints'),
                avgPoints: sql`COALESCE(AVG(${carduriClienti.puncteAcumulate}), 0)`.as('avgPoints'),
            })
            .from(carduriClienti)
            .groupBy(carduriClienti.tipUnicCard);

        // Veniturile generate de utilizatorii din fiecare nivel de card (comenzi plătite)
        const revenueByLevel = await db
            .select({
                tipCard: carduriClienti.tipUnicCard,
                totalRevenue: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)`.as('totalRevenue'),
                orderCount: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('orderCount'),
                avgOrderValue: sql`COALESCE(AVG(${comenzi.totalPlata}), 0)`.as('avgOrderValue'),
            })
            .from(carduriClienti)
            .leftJoin(user, eq(carduriClienti.codUnicUtilizator, user.id))
            .leftJoin(comenzi, and(
                eq(user.id, comenzi.codUnicUtilizator),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .groupBy(carduriClienti.tipUnicCard);

        // Combinăm distribuția cu veniturile pentru fiecare tip de card
        const levelData = cardTypes.map(cardType => {
            const dist = userDistribution.find(d => d.tipCard === cardType.tipUnicCard) || {};
            const rev = revenueByLevel.find(r => r.tipCard === cardType.tipUnicCard) || {};

            return {
                tipCard: cardType.tipUnicCard,
                nume: cardType.nume,
                beneficii: cardType.beneficii,
                userCount: parseInt(dist.userCount) || 0,
                totalPoints: parseFloat(dist.totalPoints) || 0,
                avgPoints: parseFloat(dist.avgPoints) || 0,
                totalRevenue: parseFloat(rev.totalRevenue) || 0,
                orderCount: parseInt(rev.orderCount) || 0,
                avgOrderValue: parseFloat(rev.avgOrderValue) || 0,
            };
        });

        const totalUsers = levelData.reduce((sum, l) => sum + l.userCount, 0);
        const totalRevenue = levelData.reduce((sum, l) => sum + l.totalRevenue, 0);
        const totalOrders = levelData.reduce((sum, l) => sum + l.orderCount, 0);
        const totalPoints = levelData.reduce((sum, l) => sum + l.totalPoints, 0);

        // Adăugăm procentajele de distribuție per nivel
        const distributionWithPercentages = levelData.map(level => ({
            ...level,
            userPercentage: totalUsers > 0 ? ((level.userCount / totalUsers) * 100).toFixed(1) : 0,
            revenuePercentage: totalRevenue > 0 ? ((level.totalRevenue / totalRevenue) * 100).toFixed(1) : 0,
            revenuePerUser: level.userCount > 0 ? (level.totalRevenue / level.userCount).toFixed(2) : 0,
        }));

        // Calculăm metrici de eficiență: premium = Silver, Gold, Platinum
        const premiumUsers = levelData
            .filter(l => ['SILVER', 'GOLD', 'PLATINUM'].includes(l.tipCard))
            .reduce((sum, l) => sum + l.userCount, 0);

        const premiumRevenue = levelData
            .filter(l => ['SILVER', 'GOLD', 'PLATINUM'].includes(l.tipCard))
            .reduce((sum, l) => sum + l.totalRevenue, 0);

        const efficiency = {
            totalUsers,
            totalRevenue,
            totalOrders,
            totalPoints,
            avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
            avgRevenuePerUser: totalUsers > 0 ? (totalRevenue / totalUsers) : 0,
            premiumUserPercentage: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0,
            premiumRevenuePercentage: totalRevenue > 0 ? ((premiumRevenue / totalRevenue) * 100).toFixed(1) : 0,
            loyaltyROI: premiumUsers > 0 && totalUsers > 0
                ? ((premiumRevenue / premiumUsers) / (totalRevenue / totalUsers)).toFixed(2)
                : 'N/A',
        };

        // Generăm insight-uri automate bazate pe datele calculate
        const insights = [];

        if (parseFloat(efficiency.premiumRevenuePercentage) > parseFloat(efficiency.premiumUserPercentage)) {
            insights.push({
                type: 'positive',
                message: `Utilizatorii premium (${efficiency.premiumUserPercentage}% din total) generează ${efficiency.premiumRevenuePercentage}% din venituri - programul de fidelitate este eficient!`,
            });
        }

        const goldPlatinum = levelData.filter(l => ['GOLD', 'PLATINUM'].includes(l.tipCard));
        const goldPlatinumRevenue = goldPlatinum.reduce((sum, l) => sum + l.totalRevenue, 0);
        if (goldPlatinumRevenue > 0) {
            insights.push({
                type: 'info',
                message: `Membrii Gold și Platinum au generat ${goldPlatinumRevenue.toFixed(2)} lei - focus pe reținerea acestor clienți.`,
            });
        }

        const bronze = levelData.find(l => l.tipCard === 'BRONZE');
        if (bronze && bronze.userCount > 0) {
            insights.push({
                type: 'action',
                message: `${bronze.userCount} utilizatori la nivel Bronze - oportunitate de upgrade prin campanii targetate.`,
            });
        }

        res.json({
            success: true,
            data: {
                levelData: distributionWithPercentages,
                efficiency,
                insights,
            },
        });
    } catch (error) {
        console.error('Loyalty report error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut genera raportul de fidelitate',
        });
    }
};

// Raport de performanță a locațiilor: bilete vândute, venituri și distribuția pe tipuri de bilete
// Calculul se face în JS (nu SQL pur) pentru a suporta agregarea complexă fără ORM joins multiple
export const getLocationPerformance = async (req, res) => {
    try {
        const allLocations = await db.select().from(locatiiPublice);
        const allTicketTypes = await db.select().from(tipuriBilete);

        const purchasedTickets = await db
            .select({
                codUnicTipBilet: bileteCumparate.codUnicTipBilet,
                cantitate: bileteCumparate.cantitate,
                numarComanda: bileteCumparate.numarComanda,
            })
            .from(bileteCumparate);

        const paidOrders = await db
            .select()
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        const paidOrderNumbers = new Set(paidOrders.map(o => o.numarComanda));

        // Calculăm biletele vândute și veniturile pentru fiecare locație
        const locationStats = allLocations.map(loc => {
            const locationTicketTypes = allTicketTypes.filter(t => t.codUnicLocatie === loc.codUnicLocatie);
            const ticketTypeIds = new Set(locationTicketTypes.map(t => t.codUnicTipBilet));

            let totalTickets = 0;
            let totalRevenue = 0;
            const orderSet = new Set();

            purchasedTickets.forEach(pt => {
                if (ticketTypeIds.has(pt.codUnicTipBilet) && paidOrderNumbers.has(pt.numarComanda)) {
                    totalTickets += pt.cantitate || 0;
                    orderSet.add(pt.numarComanda);

                    const ticketType = locationTicketTypes.find(t => t.codUnicTipBilet === pt.codUnicTipBilet);
                    if (ticketType) {
                        totalRevenue += (ticketType.pret || 0) * (pt.cantitate || 0);
                    }
                }
            });

            return {
                codUnicLocatie: loc.codUnicLocatie,
                numeLoc: loc.numeLoc,
                adresa: loc.adresa,
                oras: loc.oras,
                totalTickets,
                totalRevenue,
                orderCount: orderSet.size,
                ticketTypes: locationTicketTypes.map(t => {
                    const ticketsSold = purchasedTickets
                        .filter(pt => pt.codUnicTipBilet === t.codUnicTipBilet && paidOrderNumbers.has(pt.numarComanda))
                        .reduce((sum, pt) => sum + (pt.cantitate || 0), 0);
                    return {
                        tipBilet: t.tipBilet,
                        pretBilet: t.pret || 0,
                        ticketsSold,
                    };
                }),
            };
        });

        locationStats.sort((a, b) => b.totalTickets - a.totalTickets);

        const totalTicketsAll = locationStats.reduce((sum, loc) => sum + loc.totalTickets, 0);
        const totalRevenueAll = locationStats.reduce((sum, loc) => sum + loc.totalRevenue, 0);

        const enrichedLocationData = locationStats.map((loc, index) => ({
            rank: index + 1,
            ...loc,
            ticketPercentage: totalTicketsAll > 0 ? ((loc.totalTickets / totalTicketsAll) * 100).toFixed(1) : 0,
            revenuePercentage: totalRevenueAll > 0 ? ((loc.totalRevenue / totalRevenueAll) * 100).toFixed(1) : 0,
            avgRevenuePerTicket: loc.totalTickets > 0 ? (loc.totalRevenue / loc.totalTickets).toFixed(2) : 0,
        }));

        const topPerformers = enrichedLocationData.slice(0, 3);
        const underperformers = enrichedLocationData.filter(loc => loc.totalTickets === 0);
        const avgTicketsPerLocation = totalTicketsAll / allLocations.length || 0;

        // Insight-uri automate: cel mai bun performer, locații fără vânzări, locații peste medie
        const insights = [];

        if (topPerformers.length > 0 && topPerformers[0].totalTickets > 0) {
            insights.push({
                type: 'positive',
                message: `"${topPerformers[0].numeLoc}" este liderul cu ${topPerformers[0].totalTickets} bilete vândute (${topPerformers[0].ticketPercentage}% din total).`,
            });
        }
        if (underperformers.length > 0) {
            insights.push({
                type: 'action',
                message: `${underperformers.length} locații nu au înregistrat vânzări - necesită promovare suplimentară.`,
            });
        }
        const aboveAverage = enrichedLocationData.filter(loc => loc.totalTickets > avgTicketsPerLocation);
        if (aboveAverage.length > 0 && avgTicketsPerLocation > 0) {
            insights.push({
                type: 'info',
                message: `${aboveAverage.length} din ${allLocations.length} locații au vânzări peste medie (>${avgTicketsPerLocation.toFixed(1)} bilete).`,
            });
        }

        res.json({
            success: true,
            data: {
                stats: {
                    totalLocations: allLocations.length,
                    totalTickets: totalTicketsAll,
                    totalRevenue: totalRevenueAll,
                    avgTicketsPerLocation: avgTicketsPerLocation.toFixed(1),
                    avgRevenuePerLocation: (totalRevenueAll / allLocations.length || 0).toFixed(2),
                },
                locationData: enrichedLocationData,
                topPerformers,
                underperformers,
                insights,
            },
        });
    } catch (error) {
        console.error('Location performance report error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut genera raportul de performanță',
        });
    }
};
