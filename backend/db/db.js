import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Deschidem conexiunea SQLite cu calea absolută la fișierul bazei de date
const sqlite = new Database(join(__dirname, 'museum.db'));

// Activăm foreign keys — SQLite le are dezactivate implicit
sqlite.pragma('foreign_keys = ON');

// Instanța Drizzle ORM cu schema noastră — folosită în toată aplicația
export const db = drizzle(sqlite, { schema });

// Exportăm și conexiunea SQLite brută pentru interogări raw dacă e nevoie
export { sqlite };
