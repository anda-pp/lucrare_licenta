/**
 * Seed Orders and Reviews for existing users
 * Usage: npm run seed-user-data
 */

import { db } from './db.js';
import { user, recenzii, comenzi, locatiiPublice, tipuriBilete, bileteCumparate, facturi } from './schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { updateUserLoyaltyPoints } from '../services/loyaltyPoints.service.js';

async function seedUserData() {
    console.log('🌱 Seeding orders and reviews for users...\n');

    try {
        // Find users by email
        const ionUser = await db
            .select()
            .from(user)
            .where(eq(user.email, 'ionpopescu@example.com'))
            .limit(1);

        const alexandraUser = await db
            .select()
            .from(user)
            .where(eq(user.email, 'alexandragrigore@example.com'))
            .limit(1);

        if (ionUser.length === 0) {
            console.log('❌ User ionpopescu@example.com not found. Please register first.');
            return;
        }

        if (alexandraUser.length === 0) {
            console.log('❌ User alexandragrigore@example.com not found. Please register first.');
            return;
        }

        const ionId = ionUser[0].id;
        const alexandraId = alexandraUser[0].id;

        console.log(`✅ Found Ion Popescu: ${ionId}`);
        console.log(`✅ Found Alexandra Grigore: ${alexandraId}\n`);

        // Get all locations and ticket types
        const locations = await db.select().from(locatiiPublice);
        const tickets = await db.select().from(tipuriBilete);

        if (locations.length === 0) {
            console.log('❌ No locations found. Please run db:seed first.');
            return;
        }

        console.log('📝 Creating reviews...');

        // Reviews for Ion Popescu
        const ionReviews = [
            {
                numarRecenzie: crypto.randomUUID(),
                codUnicUtilizator: ionId,
                codUnicLocatie: locations[0]?.codUnicLocatie,
                descriereRecenzie: 'Muzeu extraordinar! Colecția de artă este impresionantă. Recomand cu căldură!',
                rating: 5,
            },
            {
                numarRecenzie: crypto.randomUUID(),
                codUnicUtilizator: ionId,
                codUnicLocatie: locations[1]?.codUnicLocatie,
                descriereRecenzie: 'Foarte frumos, dar aglomerat în weekend. Merită vizitat în timpul săptămânii.',
                rating: 4,
            },
        ];

        // Reviews for Alexandra Grigore
        const alexandraReviews = [
            {
                numarRecenzie: crypto.randomUUID(),
                codUnicUtilizator: alexandraId,
                codUnicLocatie: locations[0]?.codUnicLocatie,
                descriereRecenzie: 'O experiență culturală deosebită! Ghidul a fost foarte bine pregătit.',
                rating: 5,
            },
            {
                numarRecenzie: crypto.randomUUID(),
                codUnicUtilizator: alexandraId,
                codUnicLocatie: locations[2]?.codUnicLocatie,
                descriereRecenzie: 'Am petrecut câteva ore minunate aici. Expoziția temporară a fost fascinantă!',
                rating: 5,
            },
            {
                numarRecenzie: crypto.randomUUID(),
                codUnicUtilizator: alexandraId,
                codUnicLocatie: locations[1]?.codUnicLocatie,
                descriereRecenzie: 'Bun, dar prețurile sunt cam mari pentru studenți.',
                rating: 3,
            },
        ];

        // Insert reviews
        for (const review of [...ionReviews, ...alexandraReviews]) {
            if (review.codUnicLocatie) {
                await db.insert(recenzii).values(review).onConflictDoNothing();
            }
        }
        console.log(`✅ Created ${ionReviews.length + alexandraReviews.length} reviews\n`);

        console.log('🎫 Creating orders...');

        // Orders for Ion Popescu (prices match tickets: 2×Adult=40, 1×Student=10, 1×Elev=5)
        const ionOrder1 = await db.insert(comenzi).values({
            codUnicUtilizator: ionId,
            totalPlata: 40.00,
            statusPlata: 'Plătit',
        }).returning({ numarComanda: comenzi.numarComanda });

        const ionOrder2 = await db.insert(comenzi).values({
            codUnicUtilizator: ionId,
            totalPlata: 10.00,
            statusPlata: 'Plătit',
        }).returning({ numarComanda: comenzi.numarComanda });

        const ionOrder3 = await db.insert(comenzi).values({
            codUnicUtilizator: ionId,
            totalPlata: 5.00,
            statusPlata: 'Plătit',
        }).returning({ numarComanda: comenzi.numarComanda });

        // Orders for Alexandra Grigore (1×Adult=20, 1×Student=10)
        const alexandraOrder1 = await db.insert(comenzi).values({
            codUnicUtilizator: alexandraId,
            totalPlata: 20.00,
            statusPlata: 'Plătit',
        }).returning({ numarComanda: comenzi.numarComanda });

        const alexandraOrder2 = await db.insert(comenzi).values({
            codUnicUtilizator: alexandraId,
            totalPlata: 60.00,
            statusPlata: 'În așteptare',
        }).returning({ numarComanda: comenzi.numarComanda });

        const alexandraOrder3 = await db.insert(comenzi).values({
            codUnicUtilizator: alexandraId,
            totalPlata: 10.00,
            statusPlata: 'Plătit',
        }).returning({ numarComanda: comenzi.numarComanda });

        console.log('✅ Created 6 orders\n');

        console.log('💰 Calculating loyalty points...');

        // Update loyalty points for paid orders
        // Ion Popescu: 40 + 10 + 5 = 55 points (stays Bronze)
        await updateUserLoyaltyPoints(ionId, 40);
        await updateUserLoyaltyPoints(ionId, 10);
        await updateUserLoyaltyPoints(ionId, 5);

        // Alexandra Grigore: 20 + 10 = 30 points (stays Bronze)
        await updateUserLoyaltyPoints(alexandraId, 20);
        await updateUserLoyaltyPoints(alexandraId, 10);

        console.log('✅ Loyalty points calculated\n');

        console.log('🧾 Creating invoices...');

        // Create invoices for paid orders
        const paidOrders = [ionOrder1[0], ionOrder2[0], ionOrder3[0], alexandraOrder1[0], alexandraOrder3[0]];

        for (let i = 0; i < paidOrders.length; i++) {
            await db.insert(facturi).values({
                numarComanda: paidOrders[i].numarComanda,
                serieFactura: `MG${String(2026).slice(2)}${String(i + 1).padStart(4, '0')}`,
                dataFacturare: new Date().toISOString().split('T')[0],
                tva: 0.19,
                totalFactura: [40, 10, 5, 20, 10][i],
            });
        }

        console.log(`✅ Created ${paidOrders.length} invoices\n`);

        // Add purchased tickets if we have ticket types
        if (tickets.length > 0) {
            console.log('🎟️ Creating purchased tickets...');

            const purchasedTickets = [
                { nrBiletCumparat: crypto.randomUUID(), codUnicTipBilet: tickets[0]?.codUnicTipBilet, numarComanda: ionOrder1[0]?.numarComanda, cantitate: 2 },
                { nrBiletCumparat: crypto.randomUUID(), codUnicTipBilet: tickets[1]?.codUnicTipBilet, numarComanda: ionOrder2[0]?.numarComanda, cantitate: 1 },
                { nrBiletCumparat: crypto.randomUUID(), codUnicTipBilet: tickets[2]?.codUnicTipBilet, numarComanda: ionOrder3[0]?.numarComanda, cantitate: 1 },
                { nrBiletCumparat: crypto.randomUUID(), codUnicTipBilet: tickets[0]?.codUnicTipBilet, numarComanda: alexandraOrder1[0]?.numarComanda, cantitate: 1 },
                // alexandraOrder2 nu are bilet pentru că e "În așteptare" (nu e plătită)
                { nrBiletCumparat: crypto.randomUUID(), codUnicTipBilet: tickets[1]?.codUnicTipBilet, numarComanda: alexandraOrder3[0]?.numarComanda, cantitate: 1 },
            ];

            for (const ticket of purchasedTickets) {
                if (ticket.codUnicTipBilet && ticket.numarComanda) {
                    await db.insert(bileteCumparate).values(ticket).onConflictDoNothing();
                }
            }
            console.log(`✅ Created ${purchasedTickets.length} purchased tickets\n`);
        }

        console.log('🎉 User data seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - Ion Popescu: 2 reviews, 3 orders');
        console.log('   - Alexandra Grigore: 3 reviews, 3 orders');

    } catch (error) {
        console.error('❌ Seeding error:', error);
    }

    process.exit(0);
}

seedUserData();
