import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';

// Verificăm starea locatiilor și imaginilor din DB
const locs = await db.all(sql`SELECT cod_unic_locatie, nume_loc, imagine_url FROM locatii_publice`);
console.log('=== LOCATII (cod | nume | imagine_url) ===');
locs.forEach(l => console.log(l.cod_unic_locatie.substring(0, 8), '|', l.nume_loc, '|', l.imagine_url || 'NULL'));

const imgs = await db.all(sql`SELECT cod_unic_locatie, cale_fisier FROM imagini_locatii ORDER BY cod_unic_locatie`);
console.log('\n=== IMAGINI GALERIE (cod_locatie | cale) ===');
imgs.forEach(i => console.log(i.cod_unic_locatie.substring(0, 8), '|', i.cale_fisier));

process.exit(0);
