/**
 * seed.js — Seeder complet pentru aplicația de muzee și galerii din România
 * Folosește @faker-js/faker cu locale ro pentru date realistice în română.
 *
 * Ruleaza: npm run db:seed
 */

import { db } from './db.js';
import { faker } from '@faker-js/faker/locale/ro';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import {
    user,
    judete,
    locatiiPublice,
    tipuriBilete,
    comenzi,
    bileteCumparate,
    recenzii,
    evenimente,
    artisti,
    cardFidelitate,
    carduriClienti,
} from './schema.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

/** Returns a random Date within the last `months` months as a JS Date */
function randomDateInLastMonths(months = 6) {
    const now = Date.now();
    const start = now - months * 30 * 24 * 3600 * 1000;
    return new Date(start + Math.random() * (now - start));
}

/** Converts a Date to an ISO string for text columns */
const isoStr = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a random item from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Static Data ────────────────────────────────────────────────────────────

const JUDETE = [
    { codJudet: 'B', numeJudet: 'București' },
    { codJudet: 'CJ', numeJudet: 'Cluj' },
    { codJudet: 'IS', numeJudet: 'Iași' },
    { codJudet: 'SB', numeJudet: 'Sibiu' },
    { codJudet: 'TM', numeJudet: 'Timiș' },
    { codJudet: 'BV', numeJudet: 'Brașov' },
    { codJudet: 'CT', numeJudet: 'Constanța' },
];

const CARD_TYPES = [
    { tipUnicCard: 'BRONZE', numeCard: 'Bronze', puncteCard: 0, oferteSpeciale: '5% reducere la bilete', oferteBunVenit: 'Ghid digital gratuit' },
    { tipUnicCard: 'SILVER', numeCard: 'Silver', puncteCard: 100, oferteSpeciale: '10% reducere + acces prioritar', oferteBunVenit: 'Audioghid gratuit la prima vizită' },
    { tipUnicCard: 'GOLD', numeCard: 'Gold', puncteCard: 500, oferteSpeciale: '20% reducere, acces VIP, parcare gratuită', oferteBunVenit: 'Tur ghidat exclusiv + catalog cadou' },
    { tipUnicCard: 'PLATINUM', numeCard: 'Platinum', puncteCard: 1000, oferteSpeciale: '30% reducere, acces nelimitat, invitații la vernisaje', oferteBunVenit: 'Membership anual + experiență VIP' },
];

// ─── Real Romanian Locations ────────────────────────────────────────────────

const LOCATIONS = [
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul Național de Artă al României',
        orasLoc: 'București',
        judet: 'B',
        adresa: 'Calea Victoriei 49-53, Sector 1',
        orar: 'Miercuri–Duminică: 10:00–18:00 | Luni–Marți: Închis',
        scurtaDescriere: 'Cel mai important muzeu de artă din România, adăposteşte peste 100.000 de lucrări de artă românescă şi europeană, de la Evul Mediu până în contemporaneitate. Galeria Naţională cuprinde capodopere semnate de Grigorescu, Aman, Tonitza şi Pallady.',
        siteOficial: 'https://www.mnar.arts.ro',
        locatieHarta: '44.4396,26.0964',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul Național de Istorie a României',
        orasLoc: 'București',
        judet: 'B',
        adresa: 'Calea Victoriei 12, Sector 3',
        orar: 'Miercuri–Duminică: 10:00–18:00 | Luni–Marți: Închis',
        scurtaDescriere: 'Sediu al celui mai cuprinzător patrimoniu de istorie și arheologie din România, incluzând faimoasa Columnă a lui Traian în miniatură și tezaurul Cloșca cu Puii de Aur.',
        siteOficial: 'https://www.mnir.ro',
        locatieHarta: '44.4321,26.0965',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Galerie',
        numeLoc: 'Galeria Posibilă',
        orasLoc: 'București',
        judet: 'B',
        adresa: 'Str. Mendeleev 5, Sector 1',
        orar: 'Marți–Sâmbătă: 12:00–20:00 | Duminică–Luni: Închis',
        scurtaDescriere: 'Galerie independentă de artă contemporană, dedicată proiectelor experimentale și vernisajelor unor artiști emergenti din scena românescă și internațională.',
        siteOficial: 'https://galeriaposibila.ro',
        locatieHarta: '44.4450,26.0993',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Palatul Mogoșoaia',
        orasLoc: 'București',
        judet: 'B',
        adresa: 'Calea Mogoșoaia 51',
        orar: 'Marți–Duminică: 10:00–17:00 | Luni: Închis',
        scurtaDescriere: 'Construită de Constantin Brâncoveanu la 1702, reședința de la Mogoșoaia este un simbol al stilului brâncovenesc. Adăpostește Muzeul de Artă Brâncovenească cu colecţii de valoare excepţională.',
        siteOficial: 'https://palatulmogosoaia.ro',
        locatieHarta: '44.5219,25.9827',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul Naţional Brukenthal',
        orasLoc: 'Sibiu',
        judet: 'SB',
        adresa: 'Piaţa Mare 4-5',
        orar: 'Marți–Duminică: 10:00–18:00 | Luni: Închis',
        scurtaDescriere: 'Fondat în 1817, este cel mai vechi muzeu din România și unul dintre cele mai renumite din Europa Centrală. Colecţia sa cuprinde picturi flamande, olandeze și italiene de mare valoare.',
        siteOficial: 'https://www.brukenthalmuseum.ro',
        locatieHarta: '45.7965,24.1521',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul ASTRA',
        orasLoc: 'Sibiu',
        judet: 'SB',
        adresa: 'Calea Rășinari 20',
        orar: 'Marți–Duminică: 10:00–18:00 | Luni: Închis',
        scurtaDescriere: 'Cel mai mare muzeu etnografic în aer liber din România și unul dintre cele mai mari din Europa. Prezintă gospodării, mori, pivnițe și meșteșuguri din toate zonele folclorice ale țării.',
        siteOficial: 'https://www.muzeulastra.ro',
        locatieHarta: '45.7489,24.1211',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul de Artă Cluj-Napoca',
        orasLoc: 'Cluj-Napoca',
        judet: 'CJ',
        adresa: 'Piața Unirii 30',
        orar: 'Marți–Duminică: 10:00–17:00 | Luni: Închis',
        scurtaDescriere: 'Găzduit în Palatul Bánffy, muzeul deţine una din cele mai importante colecţii de artă plastică din România: pictură, sculptură şi artă decorativă din Evul Mediu până azi.',
        siteOficial: 'https://www.macluj.ro',
        locatieHarta: '46.7693,23.5903',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Galerie',
        numeLoc: 'Plan B',
        orasLoc: 'Cluj-Napoca',
        judet: 'CJ',
        adresa: 'Str. Henri Barbusse 59-61',
        orar: 'Marți–Sâmbătă: 11:00–19:00 | Duminică–Luni: Închis',
        scurtaDescriere: 'Galerie de artă contemporană cu sedii la Cluj și Berlin, reprezentând artiști de talie internațională. Este un hub creativ pentru arta conceptuală și media.',
        siteOficial: 'https://www.plan-b.ro',
        locatieHarta: '46.7756,23.5921',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Muzeu',
        numeLoc: 'Muzeul Unirii Iași',
        orasLoc: 'Iași',
        judet: 'IS',
        adresa: 'Str. Alexandru Lăpușneanu 14',
        orar: 'Marți–Duminică: 10:00–17:00 | Luni: Închis',
        scurtaDescriere: 'Muzeul găzduit în Casa Cuza, locul unde s-a semnat actul Unirii Principatelor Române din 1859. Expune documente, obiecte personale și tablouri de epocă.',
        siteOficial: 'https://mjia.ro',
        locatieHarta: '47.1585,27.5901',
        statusLocatie: 'Activ',
    },
    {
        tipLocatie: 'Galerie',
        numeLoc: 'Galeria Calina',
        orasLoc: 'Timișoara',
        judet: 'TM',
        adresa: 'Str. M. Eminescu 6',
        orar: 'Luni–Vineri: 10:00–19:00 | Sâmbătă: 11:00–17:00 | Duminică: Închis',
        scurtaDescriere: 'Una dintre cele mai active galerii din vestul țării, promovând artiști timișoreni și naţionali cu expoziţii de pictură, fotografie și instalație.',
        siteOficial: 'https://galeriacalina.ro',
        locatieHarta: '45.7489,21.2087',
        statusLocatie: 'Activ',
    },
];

// ─── Real Romanian Artists ───────────────────────────────────────────────────

const ARTISTS_DATA = [
    {
        nume: 'Adrian Ghenie',
        biografie: 'Pictor român născut în 1977 la Baia Mare. Unul dintre cei mai importanți artiști contemporani români, cunoscut pentru lucrările sale expresioniste influențate de figuri istorice precum Charles Darwin și Adolf Hitler. Absolvent al Universității de Artă și Design din Cluj-Napoca.',
        interviu: 'https://www.youtube.com/watch?v=AdrianGhenie',
        linkOpere: 'https://hauser-wirth.com/artists/24-adrian-ghenie/',
    },
    {
        nume: 'Nicolae Grigorescu',
        biografie: 'Considerat fondatorul picturii românești moderne (1838–1907). A ucenicit la Paris, asimilând influențele impresionismului franco-flamand. Celebre sunt lucrările sale cu ciobănițe, câmpuri de mac și soldați din Războiul de Independență.',
        interviu: null,
        linkOpere: 'https://ro.wikipedia.org/wiki/Nicolae_Grigorescu',
    },
    {
        nume: 'Alexandra Pirici',
        biografie: 'Artist și coregraf bucureștean, lucrând la intersecția dintre performance, dans și artă vizuală. A participat la Bienala de la Veneția (2013), Documenta 14 și la principalele galerii internaționale.',
        interviu: 'https://www.youtube.com/watch?v=AlexandraPirici',
        linkOpere: 'https://alexandrapirici.com',
    },
    {
        nume: 'Ion Theodorescu-Sion',
        biografie: 'Pictor și grafician român (1882–1939), fondator al curentului expresionist în arta românească. Stilul său sintetic și forța cromatică l-au plasat printre cei mai originali reprezentanți ai avangardei interbelice.',
        interviu: null,
        linkOpere: 'https://ro.wikipedia.org/wiki/Ion_Theodorescu-Sion',
    },
    {
        nume: 'Geta Brătescu',
        biografie: 'Una dintre cele mai influente artiste vizuale din România (1926–2018). A explorat identitatea, feminitatea și procesul creator prin desen, colaj, textile și performance. Reprezentată la Bienala de la Veneția 2017 și în colecții internaționale.',
        interviu: 'https://www.youtube.com/watch?v=GetaBratescu',
        linkOpere: 'https://hauser-wirth.com/artists/4527-geta-bratescu/',
    },
    {
        nume: 'Victor Man',
        biografie: 'Artist vizual clujean (n. 1974), lucrând cu pictura și instalația. Reprezentat de galeria Blum & Poe din Los Angelos și de Galeria Plan B Cluj/Berlin. Lucrările sale explorează memoria, melancholia și intimitatea.',
        interviu: null,
        linkOpere: 'https://www.plan-b.ro/artists/victor-man/',
    },
    {
        nume: 'Mircea Suciu',
        biografie: 'Pictor clujean (n. 1978). Practicând un stil neo-figurativ, Suciu explorează condiția umană prin imagini sugestive preluate din arhive media sau din viața cotidiană, cu o tehnică hiperrefinată.',
        interviu: null,
        linkOpere: 'https://www.mirceasuciu.com',
    },
];

// ─── Events ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = ['Expoziție', 'Noaptea Muzeelor', 'Workshop', 'Vernisaj', 'Conferință', 'Tur Ghidat'];

const EVENT_TEMPLATES = [
    { titlu: 'Noaptea Muzeelor 2025', tip: 'Noaptea Muzeelor', isGratuit: true, descriere: 'Eveniment european dedicat accesului gratuit la patrimoniul cultural. Muzee și galerii deschise până la miezul nopții cu programe speciale, ateliere și concerte live.' },
    { titlu: 'Vernisaj: Dialoguri în Culoare', tip: 'Vernisaj', isGratuit: true, descriere: 'Deschidere oficială a expoziției temporare ce reunește lucrări ale unor artiști contemporani din generația 2000. Vernisajul include prezentarea artistului și sesiune de autografe.' },
    { titlu: 'Expoziție: România Interbelică', tip: 'Expoziție', isGratuit: false, descriere: 'Expoziție retrospectivă ce prezintă arta, moda și arhitectura perioadei interbelice românești. Peste 200 de piese originale din colecții publice și private.' },
    { titlu: 'Workshop de Pictură Tradițională', tip: 'Workshop', isGratuit: false, descriere: 'Atelier practic condus de artizani tradiționali. Participanții vor crea propriile lucrări inspirate din pictura pe sticlă de la Nicula și icoanele pe lemn transilvane.' },
    { titlu: 'Conferință: Arta în Era Digitală', tip: 'Conferință', isGratuit: true, descriere: 'Dezbatere publică cu curatori, artiști și critici de artă despre impactul inteligenței artificiale și al NFT-urilor asupra piețelor de artă contemporane.' },
    { titlu: 'Tur Ghidat: Colecția Permanentă', tip: 'Tur Ghidat', isGratuit: false, descriere: 'Tur condus de un expert curator prin sălile colecției permanente. Maximun 15 participanți per sesiune. Programare obligatorie.' },
    { titlu: 'Expoziție: Peisajul Românesc', tip: 'Expoziție', isGratuit: false, descriere: 'O incursiune în pictura peisagistă românescă de la Grigorescu la Pallady, reunind capodopere din colecții naționale și împrumuturi din muzee europene.' },
    { titlu: 'ARCUB Fest: Artă Urbană', tip: 'Expoziție', isGratuit: true, descriere: 'Festival anual organizat de Centrul Cultural ARCUB în spații publice din București. Instalații, pictură murală și performance în cartierele istorice ale capitalei.' },
    { titlu: 'Vernisaj: Fotografie Contemporană', tip: 'Vernisaj', isGratuit: true, descriere: 'Deschiderea expoziției anuale de fotografie documentară și artistică, prezentând 30 de fotografi din România și diaspora.' },
    { titlu: 'Workshop Ceramică și Meserii Tradiționale', tip: 'Workshop', isGratuit: false, descriere: 'Sesiune practică de modelare a lutului și ardere tradițională în cuptor. Participanții pleacă acasă cu propriile creații ceramice.' },
];

// ─── Romanian review texts ─────────────────────────────────────────────────

const REVIEW_TEXTS = [
    'Muzeu impresionant, cu o colecție extraordinară. Ghizii sunt foarte bine pregătiți și capabili să explice contextul fiecărei lucrări.',
    'O experiență culturală de neratat dacă ești în România. Colecția permanentă este fascinantă, iar expozițiile temporare sunt mereu surprinzătoare.',
    'Clădire magnifică și expoziție bine organizată. Recomand turul ghidat pentru a înțelege mai bine contextul istoric al lucrărilor.',
    'Biletele sunt accesibile și valoarea culturală este imensă. Am petrecut aproape 3 ore și nu am văzut tot ce era de văzut.',
    'Excelent! Personnel amabil, spații bine întreținute. Cafeneaua de la interior are și ea un design plăcut.',
    'Am văzut expoziția temporară despre arta interbelică și a fost extraordinară. Recomandat cu căldură familiilor cu copii.',
    'Frumos, dar aș dori mai multă informație în română. Unele panouri explicative sunt doar în engleză.',
    'Locul perfect pentru o duminică culturală. Intrarea gratuită pentru studenți este un mare plus.',
    'Atmosferă deosebită, în special seara la evenimente speciale. Vernisajul la care am participat a fost memorabil.',
    'Colecția de sculptură este impresionantă. Singurul negativ: parcarea din zonă este insuficientă.',
    'Un muzeu modern, cu instalații interactive care atrag și publicul tânăr. Aplicația mobilă este utilă.',
    'Excelentă organizare a spațiului. Lucrările sunt puse în valoare de o lumină studiată cu grijă.',
    'Locul de care Clujul/Bucureștiul/Iași are nevoie pentru a-și promova cultura locală. Keep it up!',
    'Am vizitat cu ocazia Nopții Muzeelor. Atmosfera de seară a adăugat un farmec aparte expoziției.',
    'Recenzii bune, dar în realitate sala principală era în renovare. Sper să revenim când e gata.',
];

// ─── Seeder Main Function ──────────────────────────────────────────────────

async function seed() {
    console.log('');
    console.log('🌱 ======================================');
    console.log('   Seeder Muzee & Galerii România v2.0');
    console.log('🌱 ======================================');
    console.log('');

    try {
        // Disable FK constraints for entire seed run to avoid wipe/insert ordering issues
        await db.run(sql`PRAGMA foreign_keys = OFF`);

        // ── STEP 0: Wipe existing data ──────────────────────────────────────
        console.log('🗑️  Ștergem datele existente...');

        await db.run(sql`DELETE FROM bilete_cumparate`);
        await db.run(sql`DELETE FROM comenzi`);
        await db.run(sql`DELETE FROM recenzii`);
        await db.run(sql`DELETE FROM interese_evenimente`);
        await db.run(sql`DELETE FROM rezervari_evenimente`);
        await db.run(sql`DELETE FROM favorite_locatii`);
        await db.run(sql`DELETE FROM evenimente`);
        await db.run(sql`DELETE FROM artisti`);
        await db.run(sql`DELETE FROM carduri_clienti`);
        await db.run(sql`DELETE FROM tipuri_bilete`);
        await db.run(sql`DELETE FROM imagini_locatii`);
        await db.run(sql`DELETE FROM locatii_publice`);
        await db.run(sql`DELETE FROM card_fidelitate`);
        await db.run(sql`DELETE FROM judete`);
        await db.run(sql`DELETE FROM account WHERE user_id IN (SELECT id FROM user WHERE email LIKE '%@test.museum.ro')`);
        await db.run(sql`DELETE FROM session  WHERE user_id IN (SELECT id FROM user WHERE email LIKE '%@test.museum.ro')`);
        await db.run(sql`DELETE FROM user WHERE email LIKE '%@test.museum.ro'`);

        console.log('   ✅ Date vechi șterse.');
        console.log('');

        // ── STEP 1: Judete ──────────────────────────────────────────────────
        console.log('📍 Adăugăm județe...');
        for (const j of JUDETE) {
            await db.insert(judete).values(j).onConflictDoNothing();
        }
        console.log(`   ✅ ${JUDETE.length} județe adăugate.`);

        // ── STEP 2: Card Fidelitate ─────────────────────────────────────────
        console.log('💳 Adăugăm tipuri de carduri de fidelitate...');
        for (const c of CARD_TYPES) {
            await db.insert(cardFidelitate).values(c).onConflictDoNothing();
        }
        console.log(`   ✅ ${CARD_TYPES.length} tipuri de card adăugate.`);

        // ── STEP 3: Locations ───────────────────────────────────────────────
        console.log('🏛️  Adăugăm locații (muzee și galerii)...');
        const insertedLocations = [];
        for (const loc of LOCATIONS) {
            const row = { codUnicLocatie: uid(), ...loc };
            await db.insert(locatiiPublice).values(row);
            insertedLocations.push(row);
        }
        console.log(`   ✅ ${insertedLocations.length} locații adăugate.`);

        // ── STEP 4: Ticket Types ────────────────────────────────────────────
        console.log('🎟️  Adăugăm tipuri de bilete...');
        const insertedTickets = [];

        const TICKET_PRICE_MAP = {
            Adult: { min: 15, max: 40 },
            Student: { min: 5, max: 15 },
            Elev: { min: 3, max: 8 },
            Pensionar: { min: 5, max: 12 },
        };

        for (const loc of insertedLocations) {
            for (const [tipBilet, range] of Object.entries(TICKET_PRICE_MAP)) {
                const ticket = {
                    codUnicTipBilet: uid(),
                    codUnicLocatie: loc.codUnicLocatie,
                    tipBilet,
                    pret: parseFloat((Math.random() * (range.max - range.min) + range.min).toFixed(2)),
                };
                await db.insert(tipuriBilete).values(ticket);
                insertedTickets.push(ticket);
            }
        }
        console.log(`   ✅ ${insertedTickets.length} tipuri de bilete adăugate.`);

        // ── STEP 5: Users ───────────────────────────────────────────────────
        console.log('👤 Adăugăm utilizatori...');

        const ROLES = [
            ...Array(15).fill('Utilizator'),
            ...Array(3).fill('Admin'),
            ...Array(2).fill('Personal'),
        ];

        const insertedUsers = [];
        for (let i = 0; i < 20; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.museum.ro`;
            const role = ROLES[i];
            const createdAt = randomDateInLastMonths(8);

            const newUser = {
                id: uid(),
                name,
                email,
                emailVerified: true,
                createdAt,
                updatedAt: createdAt,
                role,
            };
            await db.insert(user).values(newUser).onConflictDoNothing();

            // Note: We skip creating account rows for seeded users.
            // BetterAuth manages account rows internally via its signUp flow.
            // Seeded users are for data/reporting purposes only.

            insertedUsers.push(newUser);
        }
        console.log(`   ✅ ${insertedUsers.length} utilizatori adăugați.`);

        // ── STEP 6: Loyalty Cards per user ─────────────────────────────────
        console.log('🏅 Asociem carduri de fidelitate...');
        const cardTierIds = CARD_TYPES.map(c => c.tipUnicCard);
        let cardCount = 0;
        for (const u of insertedUsers) {
            // ~70% chance a user has a loyalty card
            if (Math.random() > 0.3) {
                const tierWeights = [0.4, 0.3, 0.2, 0.1]; // Bronze most common
                const rand = Math.random();
                let idx = 0;
                let acc = 0;
                for (let t = 0; t < tierWeights.length; t++) {
                    acc += tierWeights[t];
                    if (rand < acc) { idx = t; break; }
                }
                await db.insert(carduriClienti).values({
                    nrUnicCard: uid(),
                    codUnicUtilizator: u.id,
                    tipUnicCard: cardTierIds[idx],
                    puncteAcumulate: randInt(0, 1200),
                }).onConflictDoNothing();
                cardCount++;
            }
        }
        console.log(`   ✅ ${cardCount} carduri asociate utilizatorilor.`);

        // ── STEP 7: Artisti ─────────────────────────────────────────────────
        console.log('🎨 Adăugăm artiști...');
        const insertedArtists = [];
        for (const a of ARTISTS_DATA) {
            const row = { id: uid(), ...a };
            await db.insert(artisti).values(row);
            insertedArtists.push(row);
        }
        console.log(`   ✅ ${insertedArtists.length} artiști adăugați.`);

        // ── STEP 8: Events ──────────────────────────────────────────────────
        console.log('📅 Adăugăm evenimente...');
        const insertedEvents = [];
        // 3–4 events per location, spread over 6 months (past and future)
        for (const loc of insertedLocations) {
            const nEvents = randInt(2, 4);
            for (let i = 0; i < nEvents; i++) {
                const template = pick(EVENT_TEMPLATES);
                const daysOffset = randInt(-150, 90); // past 5 months to 3 months future
                const dataStart = new Date(Date.now() + daysOffset * 24 * 3600 * 1000);
                const dataSfarsit = new Date(dataStart.getTime() + randInt(3, 21) * 24 * 3600 * 1000);

                const ev = {
                    id: uid(),
                    codUnicLocatie: loc.codUnicLocatie,
                    titlu: template.titlu,
                    descriere: template.descriere,
                    dataStart,
                    dataSfarsit,
                    tipEveniment: template.tip,
                    isGratuit: template.isGratuit ? 1 : 0,
                };
                await db.insert(evenimente).values(ev);
                insertedEvents.push(ev);
            }
        }
        console.log(`   ✅ ${insertedEvents.length} evenimente adăugate.`);

        // ── STEP 9: Comenzi & Bilete ─────────────────────────────────────────
        console.log('🛒 Adăugăm comenzi și bilete...');
        let totalOrders = 0;
        let totalTickets = 0;

        const utilizatoriOnly = insertedUsers.filter(u => u.role === 'Utilizator');

        for (const u of utilizatoriOnly) {
            const nOrders = randInt(1, 5);
            for (let o = 0; o < nOrders; o++) {
                const orderDate = randomDateInLastMonths(6);
                const statusPlata = pick(['Plătit', 'Plătit', 'Plătit', 'Eșuat', 'În așteptare']);
                const statusComanda = statusPlata === 'Plătit' ? 'Activă' : pick(['Activă', 'Anulată']);

                // Pick 1–3 ticket types
                const nTicketLines = randInt(1, 3);
                let total = 0;

                // Insert order first (without total — will calculate)
                const [insertedOrder] = await db.insert(comenzi).values({
                    codUnicUtilizator: u.id,
                    totalPlata: 0, // placeholder
                    dataComanda: isoStr(orderDate),
                    statusPlata,
                    statusComanda,
                }).returning({ numarComanda: comenzi.numarComanda });

                // Insert ticket lines
                for (let t = 0; t < nTicketLines; t++) {
                    const ticket = pick(insertedTickets);
                    const qty = randInt(1, 4);
                    total += ticket.pret * qty;

                    await db.insert(bileteCumparate).values({
                        nrBiletCumparat: uid(),
                        codUnicTipBilet: ticket.codUnicTipBilet,
                        numarComanda: insertedOrder.numarComanda,
                        cantitate: qty,
                    });
                    totalTickets++;
                }

                // Update order total
                await db
                    .update(comenzi)
                    .set({ totalPlata: parseFloat(total.toFixed(2)) })
                    .where(sql`numar_comanda = ${insertedOrder.numarComanda}`);

                totalOrders++;
            }
        }
        console.log(`   ✅ ${totalOrders} comenzi adăugate (${totalTickets} linii de bilete).`);

        // ── STEP 10: Recenzii ────────────────────────────────────────────────
        console.log('⭐ Adăugăm recenzii...');
        let reviewCount = 0;

        for (const u of utilizatoriOnly) {
            // Each user reviews 1–4 random locations
            const nReviews = randInt(1, 4);
            const shuffledLocs = [...insertedLocations].sort(() => Math.random() - 0.5).slice(0, nReviews);

            for (const loc of shuffledLocs) {
                const reviewDate = randomDateInLastMonths(6);
                // Weight ratings toward 3-5 for realistic distribution
                const ratingWeights = [0.05, 0.10, 0.20, 0.35, 0.30];
                let rating = 1;
                const r = Math.random();
                let cumul = 0;
                for (let ri = 0; ri < ratingWeights.length; ri++) {
                    cumul += ratingWeights[ri];
                    if (r < cumul) { rating = ri + 1; break; }
                }

                await db.insert(recenzii).values({
                    numarRecenzie: uid(),
                    codUnicUtilizator: u.id,
                    codUnicLocatie: loc.codUnicLocatie,
                    descriereRecenzie: pick(REVIEW_TEXTS),
                    rating,
                    dataRecenzie: isoStr(reviewDate),
                });
                reviewCount++;
            }
        }
        console.log(`   ✅ ${reviewCount} recenzii adăugate.`);

        // ── STEP 11: Rezervări Evenimente ───────────────────────────────────
        console.log('📋 Adăugăm rezervări la evenimente...');

        // Fetch real existing users (e.g. your own admin account) from the DB
        const allRealUsers = await db.run(sql`SELECT id, name FROM user WHERE email NOT LIKE '%@test.museum.ro'`);
        const realUsersList = allRealUsers.rows ?? [];

        // Combine test users + real users for reservations
        const allUsersForReservations = [
            ...insertedUsers.filter(u => u.role === 'Utilizator'),
            ...realUsersList.map(r => ({ id: r.id, name: r.name })),
        ];

        // Only events of these types get reservations
        const REZERVABLE_TYPES = ['Workshop', 'Noaptea Muzeelor', 'Tur Ghidat'];
        const rezervableEvents = insertedEvents.filter(ev => REZERVABLE_TYPES.includes(ev.tipEveniment));

        const INTERVALE_ORARE = ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];
        let rezervariCount = 0;

        for (const ev of rezervableEvents) {
            // 2–5 users reserve each qualifying event
            const nRezervari = randInt(2, 5);
            const shuffledUsers = [...allUsersForReservations].sort(() => Math.random() - 0.5).slice(0, nRezervari);

            // Build available days based on event start–end window
            const startTs = ev.dataStart instanceof Date ? ev.dataStart.getTime() : ev.dataStart;
            const endTs = ev.dataSfarsit instanceof Date ? ev.dataSfarsit.getTime() : (startTs + 7 * 24 * 3600 * 1000);
            const dayRange = Math.max(1, Math.round((endTs - startTs) / (24 * 3600 * 1000)));

            for (const u of shuffledUsers) {
                const dayOffset = randInt(0, dayRange - 1);
                const ziDate = new Date(startTs + dayOffset * 24 * 3600 * 1000);
                const ziuaAleasa = ziDate.toISOString().slice(0, 10); // YYYY-MM-DD

                const rezervareDate = randomDateInLastMonths(6);

                await db.run(sql`
                    INSERT INTO rezervari_evenimente
                        (id, event_id, user_id, nume_rezervant, nr_persoane, ziua_aleasa, interval_orar, data_rezervare)
                    VALUES
                        (${uid()}, ${ev.id}, ${u.id}, ${u.name}, ${randInt(1, 4)}, ${ziuaAleasa}, ${pick(INTERVALE_ORARE)}, ${Math.floor(rezervareDate.getTime() / 1000)})
                `);
                rezervariCount++;
            }
        }
        console.log(`   ✅ ${rezervariCount} rezervări adăugate pentru ${rezervableEvents.length} evenimente rezervabile.`);

        // ── Summary ─────────────────────────────────────────────────────────
        console.log('');
        console.log('🎉 =========================================');
        console.log('   Seeder finalizat cu succes!');
        console.log('🎉 =========================================');
        console.log(`   📍 Județe:          ${JUDETE.length}`);
        console.log(`   🏛️  Locații:         ${insertedLocations.length}`);
        console.log(`   🎟️  Tipuri bilete:   ${insertedTickets.length}`);
        console.log(`   👤 Utilizatori:     ${insertedUsers.length} (15 user / 3 admin / 2 staff)`);
        console.log(`   🏅 Carduri:         ${cardCount}`);
        console.log(`   🎨 Artiști:         ${insertedArtists.length}`);
        console.log(`   📅 Evenimente:      ${insertedEvents.length}`);
        console.log(`   🛒 Comenzi:         ${totalOrders}`);
        console.log(`   ⭐ Recenzii:        ${reviewCount}`);
        console.log(`   📋 Rezervări:       ${rezervariCount} (Workshop / Noaptea Muzeelor / Tur Ghidat)`);
        console.log('');
        console.log('   ℹ️  Toți utilizatorii de test au email @test.museum.ro');
        console.log('   ℹ️  Parola dummy — folosiți un cont real (admin) pentru login.');
        console.log('');

    } catch (err) {
        console.error('');
        console.error('❌ Eroare la seeding:');
        console.error('   Message:', err.message);
        console.error('   Code:', err.code);
        console.error('   Stack:', err.stack?.split('\n').slice(0, 5).join('\n'));
        throw err;
    }
}

seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
