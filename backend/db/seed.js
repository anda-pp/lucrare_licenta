import { db } from './db.js';
import {
    judete,
    locatiiPublice,
    cardFidelitate,
    tipuriBilete,
} from './schema.js';
import crypto from 'crypto';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        // 1. Seed Judete (Romanian counties)
        console.log('Adding counties...');
        const judeteData = [
            { codJudet: 'B', numeJudet: 'București' },
            { codJudet: 'CJ', numeJudet: 'Cluj' },
            { codJudet: 'TM', numeJudet: 'Timiș' },
            { codJudet: 'IS', numeJudet: 'Iași' },
            { codJudet: 'CT', numeJudet: 'Constanța' },
            { codJudet: 'BV', numeJudet: 'Brașov' },
            { codJudet: 'SB', numeJudet: 'Sibiu' },
        ];

        for (const judet of judeteData) {
            await db.insert(judete).values(judet).onConflictDoNothing();
        }

        // 2. Seed Card Fidelitate
        console.log('Adding loyalty cards...');
        const cardTypes = [
            { tipUnicCard: 'BRONZE', numeCard: 'Bronze', puncteCard: 0, oferteSpeciale: '5% reducere la bilete', oferteBunVenit: 'Ghid digital gratuit' },
            { tipUnicCard: 'SILVER', numeCard: 'Silver', puncteCard: 100, oferteSpeciale: '10% reducere la bilete, acces prioritar', oferteBunVenit: 'Audioghid gratuit la prima vizită' },
            { tipUnicCard: 'GOLD', numeCard: 'Gold', puncteCard: 500, oferteSpeciale: '20% reducere, acces VIP, parcare gratuită', oferteBunVenit: 'Tur ghidat exclusiv + catalog cadou' },
            { tipUnicCard: 'PLATINUM', numeCard: 'Platinum', puncteCard: 1000, oferteSpeciale: '30% reducere, acces nelimitat, invitații la vernisaje', oferteBunVenit: 'Membership anual + experiență VIP' },
        ];

        for (const card of cardTypes) {
            await db.insert(cardFidelitate).values(card).onConflictDoNothing();
        }

        // 3. Seed Locations (Museums and Galleries)
        console.log('Adding museums and galleries...');
        const locations = [
            {
                codUnicLocatie: crypto.randomUUID(),
                tipLocatie: 'Muzeu',
                numeLoc: 'Muzeul Național de Artă al României',
                orasLoc: 'București',
                judet: 'B',
                adresa: 'Calea Victoriei 49-53',
                orar: 'Miercuri-Duminică: 10:00-18:00',
                scurtaDescriere: 'Cel mai important muzeu de artă din România, cu colecții de artă românească și europeană.',
                siteOficial: 'https://www.mnar.arts.ro',
                locatieHarta: '44.4396,26.0964',
                statusLocatie: 'Activ',
            },
            {
                codUnicLocatie: crypto.randomUUID(),
                tipLocatie: 'Muzeu',
                numeLoc: 'Muzeul Național de Istorie a României',
                orasLoc: 'București',
                judet: 'B',
                adresa: 'Calea Victoriei 12',
                orar: 'Miercuri-Duminică: 10:00-18:00',
                scurtaDescriere: 'Muzeul prezintă istoria României de la preistorie până în prezent.',
                siteOficial: 'https://www.mnir.ro',
                locatieHarta: '44.4321,26.0965',
                statusLocatie: 'Activ',
            },
            {
                codUnicLocatie: crypto.randomUUID(),
                tipLocatie: 'Muzeu',
                numeLoc: 'Muzeul de Artă Cluj-Napoca',
                orasLoc: 'Cluj-Napoca',
                judet: 'CJ',
                adresa: 'Piața Unirii 30',
                orar: 'Marți-Duminică: 10:00-17:00',
                scurtaDescriere: 'Muzeu de artă cu colecții de artă românească și europeană.',
                siteOficial: 'https://www.macluj.ro',
                locatieHarta: '46.7693,23.5903',
                statusLocatie: 'Activ',
            },
            {
                codUnicLocatie: crypto.randomUUID(),
                tipLocatie: 'Galerie',
                numeLoc: 'Galeria Națională',
                orasLoc: 'București',
                judet: 'B',
                adresa: 'Calea Victoriei 111',
                orar: 'Luni-Vineri: 10:00-19:00',
                scurtaDescriere: 'Galerie de artă contemporană cu expoziții temporare.',
                siteOficial: 'https://www.galerianationala.ro',
                locatieHarta: '44.4412,26.0978',
                statusLocatie: 'Activ',
            },
            {
                codUnicLocatie: crypto.randomUUID(),
                tipLocatie: 'Muzeu',
                numeLoc: 'Muzeul ASTRA',
                orasLoc: 'Sibiu',
                judet: 'SB',
                adresa: 'Calea Rășinari 20',
                orar: 'Marți-Duminică: 10:00-18:00',
                scurtaDescriere: 'Muzeul civilizației populare tradiționale ASTRA.',
                siteOficial: 'https://www.muzeulastra.ro',
                locatieHarta: '45.7489,24.1211',
                statusLocatie: 'Activ',
            },
        ];

        const insertedLocations = [];
        for (const location of locations) {
            await db.insert(locatiiPublice).values(location).onConflictDoNothing();
            insertedLocations.push(location);
        }

        // 4. Seed Ticket Types for each location
        console.log('Adding ticket types...');
        for (const location of insertedLocations) {
            const ticketTypes = [
                {
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: location.codUnicLocatie,
                    tipBilet: 'Adult',
                    pret: 20.0,
                },
                {
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: location.codUnicLocatie,
                    tipBilet: 'Student',
                    pret: 10.0,
                },
                {
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: location.codUnicLocatie,
                    tipBilet: 'Elev',
                    pret: 5.0,
                },
                {
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: location.codUnicLocatie,
                    tipBilet: 'Pensionar',
                    pret: 8.0,
                },
            ];

            for (const ticket of ticketTypes) {
                await db.insert(tipuriBilete).values(ticket).onConflictDoNothing();
            }
        }

        console.log('✅ Database seeded successfully!');
        console.log(`   - ${judeteData.length} counties`);
        console.log(`   - ${cardTypes.length} loyalty card types`);
        console.log(`   - ${insertedLocations.length} locations`);
        console.log(`   - ${insertedLocations.length * 4} ticket types`);
        console.log('');
        console.log('📝 Note: To create demo users, reviews, and orders:');
        console.log('   1. Register users via the app at http://localhost:3000/register');
        console.log('   2. Users can then create reviews and orders through the UI');
    } catch (error) {
        console.error('❌ Seed error:', error);
        throw error;
    }
}

// Run seed
seed()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
