import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./museum.db');
const sql = fs.readFileSync('./drizzle/0002_typical_prowler.sql', 'utf8');

db.exec(sql);
console.log('Migration applied successfully!');
