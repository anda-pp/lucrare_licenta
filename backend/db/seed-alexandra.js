/**
 * seed-alexandra.js
 * Adds orders, reviews, and reservations for alexandragrigore@example.com
 * Uses better-sqlite3 directly via drizzle's underlying client.
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../museum.db');
const db = new Database(dbPath);

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) {
    const d = new Date(Date.now() - n * 86400000);
    return d.toISOString().replace('T', ' ').slice(0, 19);
}

async function seedAlexandra() {
    // 1. Find user
    const user = db.prepare(`SELECT id, name FROM user WHERE email = ?`).get('alexandragrigore@example.com');
    if (!user) { console.error('❌ User not found!'); process.exit(1); }
    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // 2. Fetch needed data
    const locations = db.prepare(`SELECT cod_unic_locatie, nume_loc FROM locatii_publice LIMIT 10`).all();
    const tickets = db.prepare(`SELECT cod_unic_tip_bilet, tip_bilet, pret FROM tipuri_bilete LIMIT 10`).all();
    const events = db.prepare(`
        SELECT id, titlu, tip_eveniment, data_start, data_sfarsit
        FROM evenimente
        WHERE tip_eveniment IN ('Workshop', 'Noaptea Muzeelor', 'Tur Ghidat')
        LIMIT 8
    `).all();

    if (!locations.length || !tickets.length) {
        console.error('❌ No locations or tickets found in DB. Run the main seeder first.');
        process.exit(1);
    }

    db.pragma('foreign_keys = ON');

    // ─── ORDERS ──────────────────────────────────────────
    console.log('\n📦 Adding orders...');
    const STATUSES = ['Plătit', 'Plătit', 'Plătit', 'Eșuat', 'În așteptare'];
    let ordersCount = 0;

    for (let i = 0; i < 6; i++) {
        const loc = pick(locations);
        const ticket = pick(tickets);
        const qty = randInt(1, 3);
        const total = parseFloat((parseFloat(ticket.pret) * qty).toFixed(2));
        const status = pick(STATUSES);
        const orderDate = daysAgo(randInt(5, 120));

        // Insert order (numar_comanda is auto-increment PK)
        const stmt = db.prepare(`
            INSERT INTO comenzi (cod_unic_utilizator, total_plata, data_comanda, status_plata)
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(user.id, total, orderDate, status);
        const numComanda = result.lastInsertRowid;

        // Insert bought tickets
        db.prepare(`
            INSERT INTO bilete_cumparate (nr_bilet_cumparat, numar_comanda, cod_unic_tip_bilet, cantitate)
            VALUES (?, ?, ?, ?)
        `).run(uuidv4(), numComanda, ticket.cod_unic_tip_bilet, qty);

        console.log(`   ✅ Comandă ${numComanda}: ${loc.nume_loc} | ${qty} x ${ticket.tip_bilet} | ${total} lei [${status}]`);
        ordersCount++;
    }

    // ─── REVIEWS ────────────────────────────────────────
    console.log('\n⭐ Adding reviews...');
    const REVIEW_TEXTS = [
        'Un loc minunat, m-am simțit extraordinar. Personalul a fost foarte amabil și expoziția a meritat fiecare moment.',
        'Experiență culturală de neuitat! Colecțiile sunt impresionante, iar ghidul a explicat totul cu pasiune.',
        'Recomand cu căldură tuturor iubitorilor de artă. Arhitectura clădirii este la fel de fascinantă ca și operele expuse.',
        'Am revenit pentru a doua oară și nu m-am plictisit deloc. Fiecare sală ascunde câte o surpriză.',
        'Prețuri accesibile, program convenabil. Un must-see pentru oricine vizitează orașul!',
    ];
    let reviewCount = 0;
    const reviewedLocs = new Set();

    for (let i = 0; i < 5; i++) {
        let loc;
        let attempts = 0;
        do { loc = pick(locations); attempts++; } while (reviewedLocs.has(loc.cod_unic_locatie) && attempts < 20);
        reviewedLocs.add(loc.cod_unic_locatie);

        const rating = pick([3, 4, 4, 5, 5]);
        const text = pick(REVIEW_TEXTS);
        const reviewDate = daysAgo(randInt(3, 90));

        db.prepare(`
            INSERT INTO recenzii (numar_recenzie, cod_unic_utilizator, cod_unic_locatie, descriere_recenzie, rating, data_recenzie)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), user.id, loc.cod_unic_locatie, text, rating, reviewDate);

        console.log(`   ✅ Recenzie: ${loc.nume_loc} — ${rating}⭐`);
        reviewCount++;
    }

    // ─── RESERVATIONS ────────────────────────────────────
    console.log('\n📋 Adding reservations...');
    const INTERVALE = ['10:00-12:00', '13:00-15:00', '15:00-17:00', '18:00-20:00'];
    let rezervariCount = 0;

    const eventsToReserve = events.slice(0, Math.min(events.length, 5));
    for (const event of eventsToReserve) {
        const startTs = (event.data_start || Math.floor(Date.now() / 1000)) * 1000;
        const dayOffset = randInt(0, 6);
        const ziDate = new Date(startTs + dayOffset * 86400000);
        const ziuaAleasa = ziDate.toISOString().slice(0, 10);
        const rezervareDate = Math.floor(Date.now() / 1000) - randInt(1, 45) * 86400; // unix epoch

        db.prepare(`
            INSERT INTO rezervari_evenimente (id, event_id, user_id, nume_rezervant, nr_persoane, ziua_aleasa, interval_orar, data_rezervare)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), event.id, user.id, user.name, randInt(1, 3), ziuaAleasa, pick(INTERVALE), rezervareDate);

        console.log(`   ✅ Rezervare: "${event.titlu}" (${event.tip_eveniment}) pe ${ziuaAleasa}`);
        rezervariCount++;
    }

    console.log('\n🎉 =========================================');
    console.log(`   Date adăugate pentru: ${user.name}`);
    console.log(`   🛒 ${ordersCount} comenzi`);
    console.log(`   ⭐ ${reviewCount} recenzii`);
    console.log(`   📋 ${rezervariCount} rezervări`);
    console.log('🎉 =========================================\n');

    db.close();
}

seedAlexandra().catch(e => { console.error(e); process.exit(1); });
