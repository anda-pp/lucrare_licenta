import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

// Create SQLite database connection
const sqlite = new Database('./museum.db');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export sqlite instance for raw queries if needed
export { sqlite };
