import { db } from '../db/db.js';
import { recenzii, locatiiPublice, user, comenzi, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, lte, desc, and } from 'drizzle-orm';

// Raport de sentiment al recenziilor:
// rating mediu per locație, distribuția pozitive/neutre/negative și lista recenziilor negative
export const getSentimentAnalysis = async (req, res) => {
    try {
        // Calculăm sentimentul per locație: pozitiv (≥4), neutru (=3), negativ (≤2)
        const locationRatings = await db
            .select({
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                numeLoc: locatiiPublice.numeLoc,
                adresa: locatiiPublice.adresa,
                avgRating: sql`COALESCE(AVG(${recenzii.rating}), 0)`.as('avgRating'),
                totalReviews: sql`COUNT(${recenzii.numarRecenzie})`.as('totalReviews'),
                positiveReviews: sql`SUM(CASE WHEN ${recenzii.rating} >= 4 THEN 1 ELSE 0 END)`.as('positiveReviews'),
                neutralReviews: sql`SUM(CASE WHEN ${recenzii.rating} = 3 THEN 1 ELSE 0 END)`.as('neutralReviews'),
                negativeReviews: sql`SUM(CASE WHEN ${recenzii.rating} <= 2 THEN 1 ELSE 0 END)`.as('negativeReviews'),
            })
            .from(locatiiPublice)
            .leftJoin(recenzii, eq(locatiiPublice.codUnicLocatie, recenzii.codUnicLocatie))
            .groupBy(locatiiPublice.codUnicLocatie)
            .orderBy(sql`avgRating DESC`);

        // Lista recenziilor negative (rating ≤ 2) pentru investigare și răspuns
        const negativeReviews = await db
            .select({
                numarRecenzie: recenzii.numarRecenzie,
                descriereRecenzie: recenzii.descriereRecenzie,
                rating: recenzii.rating,
                dataRecenzie: recenzii.dataRecenzie,
                userName: user.name,
                userEmail: user.email,
                numeLoc: locatiiPublice.numeLoc,
                codUnicLocatie: locatiiPublice.codUnicLocatie,
            })
            .from(recenzii)
            .leftJoin(user, eq(recenzii.codUnicUtilizator, user.id))
            .leftJoin(locatiiPublice, eq(recenzii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(lte(recenzii.rating, 2))
            .orderBy(desc(recenzii.dataRecenzie));

        // Statistici globale de sentiment pentru toate recenziile din platformă
        const overallStats = await db
            .select({
                totalReviews: sql`COUNT(*)`.as('totalReviews'),
                avgRating: sql`COALESCE(AVG(${recenzii.rating}), 0)`.as('avgRating'),
                positiveCount: sql`SUM(CASE WHEN ${recenzii.rating} >= 4 THEN 1 ELSE 0 END)`.as('positiveCount'),
                neutralCount: sql`SUM(CASE WHEN ${recenzii.rating} = 3 THEN 1 ELSE 0 END)`.as('neutralCount'),
                negativeCount: sql`SUM(CASE WHEN ${recenzii.rating} <= 2 THEN 1 ELSE 0 END)`.as('negativeCount'),
            })
            .from(recenzii);

        res.json({
            success: true,
            data: {
                overallStats: overallStats[0],
                locationRatings,
                negativeReviews,
            },
        });
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut genera raportul de sentiment',
        });
    }
};

// Raport de corelație rating-venituri:
// calculăm coeficientul Pearson între rating-ul mediu și veniturile per locație
// și identificăm locațiile la risc (rating scăzut + venituri sub medie)
export const getRatingRevenueCorrelation = async (req, res) => {
    try {
        // Rating mediu și numărul de recenzii per locație
        const locationData = await db
            .select({
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                numeLoc: locatiiPublice.numeLoc,
                avgRating: sql`COALESCE(AVG(${recenzii.rating}), 0)`.as('avgRating'),
                totalReviews: sql`COUNT(DISTINCT ${recenzii.numarRecenzie})`.as('totalReviews'),
            })
            .from(locatiiPublice)
            .leftJoin(recenzii, eq(locatiiPublice.codUnicLocatie, recenzii.codUnicLocatie))
            .groupBy(locatiiPublice.codUnicLocatie);

        // Venituri totale și numărul de comenzi per locație (comenzi plătite)
        const revenueData = await db
            .select({
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                totalRevenue: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)`.as('totalRevenue'),
                totalOrders: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('totalOrders'),
            })
            .from(locatiiPublice)
            .leftJoin(tipuriBilete, eq(locatiiPublice.codUnicLocatie, tipuriBilete.codUnicLocatie))
            .leftJoin(bileteCumparate, eq(tipuriBilete.codUnicTipBilet, bileteCumparate.codUnicTipBilet))
            .leftJoin(comenzi, and(
                eq(bileteCumparate.numarComanda, comenzi.numarComanda),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .groupBy(locatiiPublice.codUnicLocatie);

        const combinedData = locationData.map(loc => {
            const revenue = revenueData.find(r => r.codUnicLocatie === loc.codUnicLocatie);
            return {
                codUnicLocatie: loc.codUnicLocatie,
                numeLoc: loc.numeLoc,
                avgRating: parseFloat(loc.avgRating) || 0,
                totalReviews: parseInt(loc.totalReviews) || 0,
                totalRevenue: parseFloat(revenue?.totalRevenue) || 0,
                totalOrders: parseInt(revenue?.totalOrders) || 0,
            };
        });

        // Calculăm coeficientul de corelație Pearson manual în JS
        const n = combinedData.filter(d => d.totalReviews > 0 && d.totalRevenue > 0).length;
        let correlation = 0;
        let interpretation = 'Insuficiente date';

        if (n >= 2) {
            const validData = combinedData.filter(d => d.totalReviews > 0);
            const ratings = validData.map(d => d.avgRating);
            const revenues = validData.map(d => d.totalRevenue);

            const meanRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const meanRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

            let numerator = 0;
            let denomRating = 0;
            let denomRevenue = 0;

            for (let i = 0; i < validData.length; i++) {
                const diffRating = ratings[i] - meanRating;
                const diffRevenue = revenues[i] - meanRevenue;
                numerator += diffRating * diffRevenue;
                denomRating += diffRating * diffRating;
                denomRevenue += diffRevenue * diffRevenue;
            }

            if (denomRating > 0 && denomRevenue > 0) {
                correlation = numerator / Math.sqrt(denomRating * denomRevenue);
            }

            // Interpretăm coeficientul Pearson în limbaj natural
            if (correlation >= 0.7) {
                interpretation = 'Corelație pozitivă puternică - Rating-ul mare crește semnificativ vânzările';
            } else if (correlation >= 0.4) {
                interpretation = 'Corelație pozitivă moderată - Rating-ul influențează pozitiv vânzările';
            } else if (correlation >= 0.1) {
                interpretation = 'Corelație pozitivă slabă - Rating-ul are un impact minor asupra vânzărilor';
            } else if (correlation >= -0.1) {
                interpretation = 'Fără corelație semnificativă - Rating-ul nu pare să influențeze vânzările';
            } else if (correlation >= -0.4) {
                interpretation = 'Corelație negativă slabă - Situație neobișnuită, necesită investigare';
            } else {
                interpretation = 'Corelație negativă - Date anomalice, verificați calitatea datelor';
            }
        }

        const avgRevenue = combinedData.reduce((a, b) => a + b.totalRevenue, 0) / combinedData.length;

        // Locații la risc: rating sub 3.5 și venituri sub medie
        const atRiskLocations = combinedData
            .filter(d => d.avgRating < 3.5 && d.totalRevenue < avgRevenue && d.totalReviews > 0)
            .sort((a, b) => a.avgRating - b.avgRating);

        // Performeri de top: rating ≥ 4 și venituri peste medie
        const highPerformers = combinedData
            .filter(d => d.avgRating >= 4 && d.totalRevenue >= avgRevenue)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json({
            success: true,
            data: {
                correlationCoefficient: correlation,
                interpretation,
                locationData: combinedData.sort((a, b) => b.totalRevenue - a.totalRevenue),
                atRiskLocations,
                highPerformers,
                stats: {
                    avgRatingOverall: combinedData.reduce((a, b) => a + b.avgRating, 0) / combinedData.length,
                    totalRevenueOverall: combinedData.reduce((a, b) => a + b.totalRevenue, 0),
                    avgRevenuePerLocation: avgRevenue,
                },
            },
        });
    } catch (error) {
        console.error('Correlation analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut genera raportul de corelație',
        });
    }
};
