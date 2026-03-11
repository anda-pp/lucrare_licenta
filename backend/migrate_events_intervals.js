import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conectare la baza de date existenta
const sqlite = new Database(join(__dirname, 'museum.db'));

console.log('Rulam migrarea pentru adaugarea intervale_orare in tabela evenimente...');

try {
    // Adăugăm coloana dacă nu există
    sqlite.exec(`ALTER TABLE evenimente ADD COLUMN intervale_orare TEXT DEFAULT '[]';`);
    console.log(' -> SUCCES: Coloana intervale_orare a fost adaugata cu succes.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log(' -> OK: Coloana intervale_orare exista deja.');
    } else {
        console.error(' -> EROARE:', err.message);
    }
} finally {
    sqlite.close();
    console.log('Migrare incheiata cu succes. Puteti inchide acest script.');
}
