import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'db/muzee.db'));

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS interese_evenimente (
            id TEXT PRIMARY KEY,
            cod_unic_utilizator TEXT REFERENCES user(id) ON DELETE CASCADE,
            cod_unic_eveniment TEXT REFERENCES evenimente(id) ON DELETE CASCADE,
            data_interesului INTEGER NOT NULL DEFAULT (unixepoch())
        )
    `);
    console.log('✅ Tabela interese_evenimente creată cu succes!');
} catch (e) {
    console.error('❌ Eroare:', e.message);
} finally {
    db.close();
}
