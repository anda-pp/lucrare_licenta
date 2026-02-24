import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { fakerRO as faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlite = new Database(join(__dirname, '..', 'museum.db'));
const db = drizzle(sqlite, { schema });

async function seed() {
    console.log('🌱 Pornire proces de seeding cu Faker și date reale (evenimente/artiști)...');

    // 1. Array de locații reale + fictive
    const locatiiInitiale = [
        {
            codUnicLocatie: 'L-MNAR',
            numeLoc: 'Muzeul Național de Artă al României',
            tipLocatie: 'Muzeu',
            judet: 'B',
            orasLoc: 'București',
            adresa: 'Calea Victoriei 49-53',
            orar: 'L-D: 10:00 - 18:00',
            scurtaDescriere: 'Cel mai mare muzeu de artă din România, găzduiește colecții impresionante de artă românească și europeană.',
            siteOficial: 'https://www.mnar.arts.ro',
            locatieHarta: '44.4393,26.0958',
            statusLocatie: 'Activ',
            imagineUrl: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800',
        },
        {
            codUnicLocatie: 'L-ANTIPA',
            numeLoc: 'Muzeul Național de Istorie Naturală Grigore Antipa',
            tipLocatie: 'Muzeu',
            judet: 'B',
            orasLoc: 'București',
            adresa: 'Șoseaua Kiseleff nr. 1',
            orar: 'Mar-Dumin*: 10:00 - 20:00',
            scurtaDescriere: 'Istorie naturală, diorame interactive, expoziții de fluturi și dinozauri.',
            siteOficial: 'https://antipa.ro',
            locatieHarta: '44.4533,26.0847',
            statusLocatie: 'Activ',
            imagineUrl: 'https://images.unsplash.com/photo-1518998053401-a414b5166270?auto=format&fit=crop&q=80&w=800', // Dinozaur / muzeu istorie
        },
        {
            codUnicLocatie: 'L-BRUK',
            numeLoc: 'Muzeul Național Brukenthal',
            tipLocatie: 'Muzeu',
            judet: 'SB',
            orasLoc: 'Sibiu',
            adresa: 'Piața Mare 4',
            orar: 'Mie-Dum: 09:00 - 17:00',
            scurtaDescriere: 'Primul muzeu deschis oficial în România, cu o colecție valoroasă de pictură flamandă și olandeză.',
            siteOficial: 'https://www.brukenthalmuseum.ro/',
            locatieHarta: '45.7967,24.1508',
            statusLocatie: 'Activ',
            imagineUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800',
        },
        {
            codUnicLocatie: 'L-ZORZ',
            numeLoc: 'Galeria Zorzini',
            tipLocatie: 'Galerie',
            judet: 'B',
            orasLoc: 'București',
            adresa: 'Strada Sfântul Ștefan 21',
            orar: 'Joi-Sâm: 14:00 - 18:00',
            scurtaDescriere: 'Galerie de artă contemporană românească, promovând tineri artiști pe scena internațională.',
            siteOficial: 'https://zorzinigallery.com',
            locatieHarta: '44.4360,26.1150',
            statusLocatie: 'Activ',
            imagineUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
        }
    ];

    // Inseram/Actualizam locatiile
    console.log('📌 Inserare Locații...');
    for (const loc of locatiiInitiale) {
        await db.insert(schema.locatiiPublice)
            .values(loc)
            .onConflictDoUpdate({
                target: schema.locatiiPublice.codUnicLocatie,
                set: loc
            });
    }

    // 2. Evenimente reale (Cerute de user)
    console.log('📌 Curățare vechile evenimente/artiști (pentru un mediu curat)...');
    await db.delete(schema.evenimente);
    await db.delete(schema.artisti);

    console.log('📌 Inserare Evenimente...');
    const now = new Date();
    const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
    const inTwoMonths = new Date(now); inTwoMonths.setDate(now.getDate() + 60);

    const evenimenteSpeciale = [
        {
            id: uuidv4(),
            codUnicLocatie: 'L-MNAR', // La MNAR
            titlu: 'Atelier de Pictură pentru Copii: Micii Maeștri',
            descriere: 'Un atelier interactiv unde copiii vor învăța tehnici de bază în pictura pe pânză, inspirați de Nicolae Grigorescu.',
            dataStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0), // Peste 3 zile, ora 10
            dataSfarsit: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0),
            tipEveniment: 'Workshop',
            imagineUrl: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: uuidv4(),
            codUnicLocatie: 'L-ZORZ', // La Zorzini
            titlu: 'Festivalul de Stickere Urbane (Sticker Fest)',
            descriere: 'Primul festival din România dedicat artei stradale și culturii stickerelor! Zeci de artiști locali și internaționali vin să-și prezinte creațiile.',
            dataStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 12, 0), // Peste 2sapt
            dataSfarsit: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 16, 20, 0),
            tipEveniment: 'Expoziție',
            imagineUrl: 'https://images.unsplash.com/photo-1542382607-bb707d85c88b?auto=format&fit=crop&q=80&w=800' // Arta abstracta street
        },
        {
            id: uuidv4(),
            codUnicLocatie: 'L-ANTIPA',
            titlu: 'Noaptea Muzeelor: Dincolo de Umbre la Antipa',
            descriere: 'O experiență nocturnă unică printre exponatele muzeului. Tururi ghidate cu laterne și povești fascinante despre viața nocturnă a animalelor.',
            dataStart: new Date(now.getFullYear(), 4, 18, 18, 0), // Mai 18, ora 18:00 (Aprox Noaptea muzeelor)
            dataSfarsit: new Date(now.getFullYear(), 4, 19, 2, 0), // Ziua urm, ora 2:00
            tipEveniment: 'Noaptea Muzeelor',
            imagineUrl: 'https://images.unsplash.com/photo-1574627196266-407dc7dfca1a?auto=format&fit=crop&q=80&w=800'
        },
        {
            id: uuidv4(),
            codUnicLocatie: 'L-BRUK',
            titlu: 'Noaptea Muzeelor la Sibiu - Deschidere Specială',
            descriere: 'Acces gratuit la toate galeriile din Piată Mare, muzică clasică live și ateliere renascentiste.',
            dataStart: new Date(now.getFullYear(), 4, 18, 19, 0),
            dataSfarsit: new Date(now.getFullYear(), 4, 19, 1, 0),
            tipEveniment: 'Noaptea Muzeelor',
            imagineUrl: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&q=80&w=800'
        }
    ];

    for (const ev of evenimenteSpeciale) {
        await db.insert(schema.evenimente).values(ev);
    }

    // 3. Generăm câteva evenimente aleatoare
    const evenimenteFake = [];
    const tipuriFake = ['Workshop', 'Expoziție', 'Tur Ghidat', 'Lansare'];
    const locatiiIds = ['L-MNAR', 'L-ANTIPA', 'L-BRUK', 'L-ZORZ'];

    for (let i = 0; i < 5; i++) {
        const dStart = faker.date.soon({ days: 30 });
        const dSfarsit = new Date(dStart.getTime() + 4 * 60 * 60 * 1000); // +4 ore
        evenimenteFake.push({
            id: uuidv4(),
            codUnicLocatie: faker.helpers.arrayElement(locatiiIds),
            titlu: faker.lorem.words(4).toUpperCase(),
            descriere: faker.lorem.paragraph(),
            dataStart: dStart,
            dataSfarsit: dSfarsit,
            tipEveniment: faker.helpers.arrayElement(tipuriFake),
            imagineUrl: faker.image.urlLoremFlickr({ category: 'museum', width: 800, height: 400 })
        });
    }
    await db.insert(schema.evenimente).values(evenimenteFake);


    // 4. Artiști Români
    console.log('📌 Inserare Artiști...');
    const artistiSpeciali = [
        {
            id: uuidv4(),
            nume: 'Mircea Cantor',
            biografie: 'Mircea Cantor este un artist conceptual român, laureat al prestigiosului premiu Marcel Duchamp. Operele sale explorează teme socio-politice printr-o varietate de medii moderne.',
            interviu: 'Video: Cum se intersectează arta cu cotidianul.',
            linkOpere: 'https://mirceacantor.ro',
            imagineUrl: 'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80&w=600' // Placeholder om / arta
        },
        {
            id: uuidv4(),
            nume: 'Ioana Nemes',
            biografie: 'Artistă recunoscută internațional, interesată de investigarea și documentarea timpului prin proiecte conceptuale ample și instalații vizuale.',
            interviu: 'Discuție despre timpul ca material de sculptură.',
            linkOpere: 'https://ioananemes.com',
            imagineUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600'
        },
        {
            id: uuidv4(),
            nume: 'Adrian Ghenie',
            biografie: 'Unul dintre cei mai de succes pictori contemporani români, ale cărui lucrări se vând la licitații internaționale pentru sume record. O pictură viscerală, influențată de trauma istoriei europene.',
            interviu: 'Despre școala de la Cluj și impactul său mondial.',
            linkOpere: 'http://pacegallery.com/artists/adrian-ghenie',
            imagineUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600' // abstract art placeholder
        }
    ];

    // Artist fake
    const artistiFake = [];
    for (let i = 0; i < 4; i++) {
        artistiFake.push({
            id: uuidv4(),
            nume: faker.person.fullName(),
            biografie: faker.lorem.paragraphs(2),
            interviu: faker.lorem.sentence(),
            linkOpere: faker.internet.url(),
            imagineUrl: faker.image.urlLoremFlickr({ category: 'portrait', width: 600, height: 600 })
        });
    }

    await db.insert(schema.artisti).values(artistiSpeciali);
    await db.insert(schema.artisti).values(artistiFake);

    console.log('✅ Seeding finalizat cu succes!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Eroare la seeding:', err);
    process.exit(1);
});
