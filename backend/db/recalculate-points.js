/**
 * recalculate-points.js
 * Recalculates loyalty points for all users based on their 'Plătit' (paid) orders.
 * 1 RON spent = 1 Loyalty Point.
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../museum.db');
const db = new Database(dbPath);

async function recalculatePoints() {
    console.log('🔄 Începe recalcularea punctelor de fidelitate...\n');

    // 1. Setăm toate punctele la 0 mai întâi
    db.prepare(`UPDATE carduri_clienti SET puncte_acumulate = 0`).run();
    console.log('✅ Toate cardurile au fost resetate la 0 puncte.');

    // 2. Selectăm toți utilizatorii care au carduri
    const cards = db.prepare(`SELECT nr_unic_card, cod_unic_utilizator FROM carduri_clienti`).all();
    let updatedCount = 0;

    for (const card of cards) {
        // 3. Calculăm suma totală cheltuită pe comenzi "Plătit"
        const result = db.prepare(`
            SELECT SUM(total_plata) as sumaTotala
            FROM comenzi
            WHERE cod_unic_utilizator = ? AND status_plata = 'Plătit'
        `).get(card.cod_unic_utilizator);

        const sumaTotala = result?.sumaTotala || 0;
        const puncteDeAdaugat = Math.floor(sumaTotala); // 1 leu = 1 punct (rotunjit în jos la nevoie)

        // 4. Actualizăm cardul dacă are puncte
        if (puncteDeAdaugat > 0) {
            db.prepare(`
                UPDATE carduri_clienti 
                SET puncte_acumulate = ? 
                WHERE nr_unic_card = ?
            `).run(puncteDeAdaugat, card.nr_unic_card);

            updatedCount++;
        }
    }

    console.log(`\n🎉 Recalculare finalizată!`);
    console.log(`💳 Au fost actualizate ${updatedCount} carduri cu puncte din comenzi.`);
    console.log(`🎯 Regula aplicată: 1 RON plătit = 1 punct de fidelitate.`);

    db.close();
}

recalculatePoints().catch(e => { console.error(e); process.exit(1); });
