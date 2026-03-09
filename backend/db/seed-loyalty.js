/**
 * seed-loyalty.js
 * Ensures all existing users have the first level (Bronze) of the loyalty card.
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../museum.db');
const db = new Database(dbPath);

async function seedLoyalty() {
    // 1. Check if we have loyalty card types
    const basicCard = db.prepare(`SELECT tip_unic_card, nume_card FROM card_fidelitate ORDER BY puncte_card ASC LIMIT 1`).get();

    if (!basicCard) {
        console.error('❌ No loyalty card types found in DB. Need to seed card_fidelitate first.');
        process.exit(1);
    }

    console.log(`✅ Using basic loyalty card: ${basicCard.nume_card} (${basicCard.tip_unic_card})`);

    // 2. Get all users
    const users = db.prepare(`SELECT id, name FROM user WHERE role = 'Utilizator' OR role IS NULL`).all();
    console.log(`✅ Found ${users.length} users in the database.`);

    let addedCards = 0;

    for (const u of users) {
        // Check if user already has a card
        const hasCard = db.prepare(`SELECT nr_unic_card FROM carduri_clienti WHERE cod_unic_utilizator = ?`).get(u.id);

        if (!hasCard) {
            db.prepare(`
                INSERT INTO carduri_clienti (nr_unic_card, cod_unic_utilizator, tip_unic_card, puncte_acumulate)
                VALUES (?, ?, ?, ?)
            `).run(uuidv4(), u.id, basicCard.tip_unic_card, 50); // Start cu 50 puncte cadou

            addedCards++;
        }
    }

    console.log(`🎉 Added loyalty cards for ${addedCards} existing users!`);
    db.close();
}

seedLoyalty().catch(e => { console.error(e); process.exit(1); });
