import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';

console.log('Sincronizare imagineUrl pentru locatiile cu galerie dar fara cover...\n');

// Luam toate locatiile fara cover
const locsWithoutCover = await db.all(sql`SELECT cod_unic_locatie, nume_loc FROM locatii_publice WHERE imagine_url IS NULL`);

let updated = 0;
for (const loc of locsWithoutCover) {
    // Cautam prima imagine din galerie pentru aceasta locatie (ordinata dupa ordin_afisare)
    const firstImage = await db.all(sql`
        SELECT cale_fisier FROM imagini_locatii 
        WHERE cod_unic_locatie = ${loc.cod_unic_locatie}
        ORDER BY ordin_afisare ASC
        LIMIT 1
    `);
    
    if (firstImage.length > 0) {
        await db.run(sql`
            UPDATE locatii_publice 
            SET imagine_url = ${firstImage[0].cale_fisier}
            WHERE cod_unic_locatie = ${loc.cod_unic_locatie}
        `);
        console.log(`✅ Setat cover pentru "${loc.nume_loc}": ${firstImage[0].cale_fisier}`);
        updated++;
    } else {
        console.log(`⏭️  Fara imagini in galerie: "${loc.nume_loc}"`);
    }
}

console.log(`\nGata! ${updated} locatii actualizate.`);
process.exit(0);
