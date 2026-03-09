/**
 * migrate-gamification.js
 * One-time migration to create the 4 gamification tables.
 */
import { db } from './db.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🔧 Creating gamification tables...');

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS insigne (
            id TEXT PRIMARY KEY,
            nume TEXT NOT NULL,
            descriere TEXT,
            iconita TEXT NOT NULL,
            conditie TEXT NOT NULL,
            valoare_conditie INTEGER NOT NULL,
            culoare TEXT DEFAULT '#9333ea',
            mesaj_motivatie TEXT
        )
    `);

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS insigne_utilizatori (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            insigna_id TEXT NOT NULL REFERENCES insigne(id) ON DELETE CASCADE,
            data_obtinerii INTEGER NOT NULL DEFAULT (unixepoch())
        )
    `);

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS recompense (
            id TEXT PRIMARY KEY,
            nume TEXT NOT NULL,
            descriere TEXT,
            puncte_necesare INTEGER NOT NULL,
            tip TEXT DEFAULT 'voucher',
            valoare TEXT,
            activ INTEGER DEFAULT 1
        )
    `);

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS recompense_revendicate (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            recompensa_id TEXT NOT NULL REFERENCES recompense(id) ON DELETE CASCADE,
            data_revendicarii INTEGER NOT NULL DEFAULT (unixepoch()),
            status TEXT DEFAULT 'activ',
            cod_voucher TEXT NOT NULL UNIQUE,
            puncte_cheltuite INTEGER NOT NULL
        )
    `);

    console.log('✅ All gamification tables created successfully!');
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
