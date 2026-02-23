import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'db/muzee.db'));

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS favorite_locatii (
            id TEXT PRIMARY KEY,
            cod_unic_utilizator TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            cod_unic_locatie TEXT NOT NULL REFERENCES locatii_publice(cod_unic_locatie) ON DELETE CASCADE,
            data_adaugarii INTEGER NOT NULL DEFAULT (unixepoch()),
            UNIQUE(cod_unic_utilizator, cod_unic_locatie)
        )
    `);
    console.log('✅ Tabela favorite_locatii creată cu succes!');
} catch (e) {
    console.error('❌ Eroare:', e.message);
} finally {
    db.close();
}
