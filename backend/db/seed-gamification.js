/**
 * seed-gamification.js
 * Seeds the badge and reward catalog data.
 */
import { db } from './db.js';
import { sql } from 'drizzle-orm';

const BADGES = [
    { id: 'b_reviews_5', nume: 'Critic de Artă', descriere: 'Ai lăsat 5 recenzii despre locații culturale', iconita: 'MessageSquare', conditie: 'reviews_5', valoareConditie: 5, culoare: '#9333ea', mesajMotivatie: 'Lasă recenzii pentru muzee vizitate' },
    { id: 'b_reviews_1_rating5', nume: 'Perfectionist', descriere: 'Ai dat o notă perfectă de 5 stele', iconita: 'Star', conditie: 'rating_5', valoareConditie: 1, culoare: '#f59e0b', mesajMotivatie: 'Dă o notă de 5 stele unei locații care te-a impresionat' },
    { id: 'b_orders_10', nume: 'Iubitor de Cultură', descriere: 'Ai finalizat 10 vizite la muzee', iconita: 'Ticket', conditie: 'orders_10', valoareConditie: 10, culoare: '#06b6d4', mesajMotivatie: 'Cumpără bilete la muzee și galerii' },
    { id: 'b_museums_3', nume: 'Explorator', descriere: 'Ai vizitat 3 locații culturale diferite', iconita: 'Map', conditie: 'museums_3', valoareConditie: 3, culoare: '#10b981', mesajMotivatie: 'Vizitează muzee din mai multe orașe' },
    { id: 'b_events_3', nume: 'Participant Activ', descriere: 'Ai rezervat 3 evenimente culturale', iconita: 'Calendar', conditie: 'events_3', valoareConditie: 3, culoare: '#ef4444', mesajMotivatie: 'Rezervă la workshop-uri și tururi ghidate' },
    { id: 'b_loyalty_gold', nume: 'Membru Premium', descriere: 'Ai obținut cardul Gold sau Platinum', iconita: 'Crown', conditie: 'loyalty_gold', valoareConditie: 1, culoare: '#eab308', mesajMotivatie: 'Acumulează puncte pentru a avansa' },
    { id: 'b_favorites_5', nume: 'Colecționar', descriere: 'Ai adăugat 5 locații la favorite', iconita: 'Heart', conditie: 'favorites_5', valoareConditie: 5, culoare: '#ec4899', mesajMotivatie: 'Adaugă muzee preferate la lista ta' },
];

const REWARDS = [
    { id: 'r_bilet_gratuit', nume: 'Bilet Gratuit Adult', descriere: 'Intrare gratuită la oricare muzeu partener', puncteNecesare: 500, tip: 'bilet_gratuit', valoare: 'Bilet gratuit' },
    { id: 'r_reducere_20', nume: 'Reducere 20%', descriere: 'Reducere 20% la orice bilet individual', puncteNecesare: 200, tip: 'reducere', valoare: '20%' },
    { id: 'r_reducere_10', nume: 'Reducere 10%', descriere: 'Reducere 10% la orice comandă', puncteNecesare: 100, tip: 'reducere', valoare: '10%' },
    { id: 'r_voucher_ghid', nume: 'Tur Ghidat Gratuit', descriere: 'Participare gratuită la un tur ghidat', puncteNecesare: 350, tip: 'tur_ghidat', valoare: 'Tur gratuit' },
    { id: 'r_voucher_workshop', nume: 'Workshop Gratuit', descriere: 'Participare gratuită la un workshop cultural', puncteNecesare: 450, tip: 'workshop', valoare: 'Workshop gratuit' },
    { id: 'r_catalog', nume: 'Catalog Expoziție', descriere: 'Catalog fizic al unei expoziții permanente', puncteNecesare: 150, tip: 'catalog', valoare: 'Catalog muzeu' },
];

async function seedGamification() {
    console.log('🎯 Seeding gamification catalog...');

    for (const badge of BADGES) {
        await db.run(sql`
            INSERT OR REPLACE INTO insigne (id, nume, descriere, iconita, conditie, valoare_conditie, culoare, mesaj_motivatie)
            VALUES (${badge.id}, ${badge.nume}, ${badge.descriere}, ${badge.iconita}, ${badge.conditie}, ${badge.valoareConditie}, ${badge.culoare}, ${badge.mesajMotivatie})
        `);
    }
    console.log(`   ✅ ${BADGES.length} insigne adăugate`);

    for (const reward of REWARDS) {
        await db.run(sql`
            INSERT OR REPLACE INTO recompense (id, nume, descriere, puncte_necesare, tip, valoare, activ)
            VALUES (${reward.id}, ${reward.nume}, ${reward.descriere}, ${reward.puncteNecesare}, ${reward.tip}, ${reward.valoare}, 1)
        `);
    }
    console.log(`   ✅ ${REWARDS.length} recompense adăugate`);
    console.log('🎉 Gamification catalog seeded!');
}

seedGamification().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
