import Database from 'better-sqlite3';

const db = new Database('./museum.db');

// Add is_gratuit column if not exists
try {
    db.exec("ALTER TABLE evenimente ADD COLUMN is_gratuit INTEGER DEFAULT 0");
    console.log('✓ Added is_gratuit column to evenimente');
} catch (e) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ is_gratuit column already exists, skipping');
    } else throw e;
}

// Create rezervari_evenimente table
db.exec(`
CREATE TABLE IF NOT EXISTS rezervari_evenimente (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES evenimente(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    nume_rezervant TEXT NOT NULL,
    nr_persoane INTEGER NOT NULL DEFAULT 1,
    ziua_aleasa TEXT,
    interval_orar TEXT,
    data_rezervare INTEGER NOT NULL DEFAULT (unixepoch())
)
`);
console.log('✓ Created rezervari_evenimente table');

// Mark all Noaptea Muzeelor events as gratuit
const result = db.prepare("UPDATE evenimente SET is_gratuit = 1 WHERE tip_eveniment = 'Noaptea Muzeelor'").run();
console.log(`✓ Marked ${result.changes} Noaptea Muzeelor events as gratuit`);

// Show current events
const events = db.prepare("SELECT id, titlu, tip_eveniment, is_gratuit FROM evenimente").all();
console.log('\nAll events:');
events.forEach(e => console.log(`  ${e.titlu} | ${e.tip_eveniment} | gratuit=${e.is_gratuit}`));

db.close();
console.log('\nDone!');
