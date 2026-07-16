import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// Tabelele BetterAuth — necesare pentru autentificare
// ============================================

// Tabela principală de utilizatori — extinsă cu câmpuri custom (role, muzeuId, telefon)
export const user = sqliteTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    role: text('role').default('Utilizator'), // Superadmin, Admin, Personal, Utilizator
    muzeuId: text('muzeu_id'), // FK -> locatii_publice.cod_unic_locatie — muzeul la care este alocat stafful/adminul
    telefon: text('telefon'),
});

// Sesiunile active ale utilizatorilor (gestionate de BetterAuth)
export const session = sqliteTable('session', {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Conturi externe (OAuth, credențiale) legate de un utilizator
export const account = sqliteTable('account', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Token-uri de verificare email (folosite de BetterAuth)
export const verification = sqliteTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// Tabelele aplicației
// ============================================

// Județele din România — folosite pentru filtrarea locațiilor
export const judete = sqliteTable('judete', {
    codJudet: text('cod_judet').primaryKey(),
    numeJudet: text('nume_judet').notNull().unique(),
});

// Tipurile de card de fidelitate (Bronze, Silver, Gold etc.)
export const cardFidelitate = sqliteTable('card_fidelitate', {
    tipUnicCard: text('tip_unic_card').primaryKey(),
    numeCard: text('nume_card').notNull().unique(),
    puncteCard: integer('puncte_card').default(0), // pragul de puncte necesar pentru acest nivel
    oferteSpeciale: text('oferte_speciale'),
    oferteBunVenit: text('oferte_bun_venit'),
});

// Cardurile de fidelitate deținute efectiv de utilizatori
export const carduriClienti = sqliteTable('carduri_clienti', {
    nrUnicCard: text('nr_unic_card').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    tipUnicCard: text('tip_unic_card').references(() => cardFidelitate.tipUnicCard),
    puncteAcumulate: integer('puncte_acumulate').default(0),
});

// Locațiile publice din platformă: muzee și galerii
export const locatiiPublice = sqliteTable('locatii_publice', {
    codUnicLocatie: text('cod_unic_locatie').primaryKey(),
    tipLocatie: text('tip_locatie', { enum: ['Muzeu', 'Galerie'] }).notNull(),
    numeLoc: text('nume_loc').notNull(),
    orasLoc: text('oras_loc').notNull(),
    judet: text('judet').references(() => judete.codJudet),
    adresa: text('adresa').notNull(),
    orar: text('orar'),
    scurtaDescriere: text('scurta_descriere'),
    siteOficial: text('site_oficial'),
    locatieHarta: text('locatie_harta').notNull(),
    statusLocatie: text('status_locatie', { enum: ['Activ', 'Inactiv', 'Cerere'] }).notNull(),
    imagineUrl: text('imagine_url'),
});

// Tipurile de bilete disponibile pentru o locație sau un eveniment
// Dacă codUnicEveniment este NULL, biletul este de intrare la muzeu; altfel e bilet la eveniment
export const tipuriBilete = sqliteTable('tipuri_bilete', {
    codUnicTipBilet: text('cod_unic_tip_bilet').primaryKey(),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
    codUnicEveniment: text('cod_unic_eveniment').references(() => evenimente.id),
    tipBilet: text('tip_bilet', { enum: ['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'] }).notNull(),
    pret: real('pret').notNull(),
});

// Recenziile lăsate de utilizatori pentru locații
export const recenzii = sqliteTable('recenzii', {
    numarRecenzie: text('numar_recenzie').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
    descriereRecenzie: text('descriere_recenzie'),
    rating: integer('rating').notNull(), // valoare între 1 și 5
    dataRecenzie: text('data_recenzie').default(sql`CURRENT_TIMESTAMP`),
});

// Comenzile plasate de utilizatori
export const comenzi = sqliteTable('comenzi', {
    numarComanda: integer('numar_comanda').primaryKey({ autoIncrement: true }),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    totalPlata: real('total_plata').notNull(),
    dataComanda: text('data_comanda').default(sql`CURRENT_TIMESTAMP`),
    statusPlata: text('status_plata', { enum: ['Plătit', 'Eșuat', 'În așteptare'] }).notNull(),
    statusComanda: text('status_comanda', { enum: ['Activă', 'Anulată'] }).default('Activă'),
});

// Biletele individuale cumpărate, legate de o comandă
export const bileteCumparate = sqliteTable('bilete_cumparate', {
    nrBiletCumparat: text('nr_bilet_cumparat').primaryKey(),
    codUnicTipBilet: text('cod_unic_tip_bilet').references(() => tipuriBilete.codUnicTipBilet),
    numarComanda: integer('numar_comanda').references(() => comenzi.numarComanda),
    cantitate: integer('cantitate').notNull(),
    dataVizita: text('data_vizita'),
});

// Facturile generate automat la plată
export const facturi = sqliteTable('facturi', {
    numarFactura: integer('numar_factura').primaryKey({ autoIncrement: true }),
    numarComanda: integer('numar_comanda').references(() => comenzi.numarComanda),
    serieFactura: text('serie_factura').notNull(),
    dataFacturare: text('data_facturare').notNull(),
    tva: real('tva').default(0.19),
    totalFactura: real('total_factura').notNull(),
});

// Galeria de imagini a unei locații — permite upload multiplu per muzeu
export const imaginiLocatii = sqliteTable('imagini_locatii', {
    codUnicImagine: text('cod_unic_imagine').primaryKey(),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie, { onDelete: 'cascade' }),
    numeOriginal: text('nume_original').notNull(),
    caleFisier: text('cale_fisier').notNull(),
    tipFisier: text('tip_fisier').notNull(),
    marimeFisier: integer('marime_fisier'),
    dataIncarcare: text('data_incarcare').notNull(),
    ordinAfisare: integer('ordin_afisare').default(0),
});

// Evenimente organizate de muzee: expoziții, workshop-uri, Noaptea Muzeelor etc.
export const evenimente = sqliteTable('evenimente', {
    id: text('id').primaryKey(),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
    titlu: text('titlu').notNull(),
    descriere: text('descriere'),
    dataStart: integer('data_start', { mode: 'timestamp' }).notNull(),
    dataSfarsit: integer('data_sfarsit', { mode: 'timestamp' }),
    tipEveniment: text('tip_eveniment').default('General'), // 'Expozitie', 'Noaptea Muzeelor', 'Workshop'
    imagineUrl: text('imagine_url'),
    isGratuit: integer('is_gratuit', { mode: 'boolean' }).default(0),
    intervaleOrare: text('intervale_orare'), // array JSON de intervale orare: '["10:00-12:00", "14:00-16:00"]'
});

// Artiștii prezentați în platformă — biografie, interviu, link opere
export const artisti = sqliteTable('artisti', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),
    biografie: text('biografie'),
    interviu: text('interviu'), // text liber sau link YouTube
    linkOpere: text('link_opere'),
    imagineUrl: text('imagine_url'),
});

// Marcajul „Mă interesează" al utilizatorilor pe evenimente (similar cu Facebook Interested)
export const intereseEvenimente = sqliteTable('interese_evenimente', {
    id: text('id').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id, { onDelete: 'cascade' }),
    codUnicEveniment: text('cod_unic_eveniment').references(() => evenimente.id, { onDelete: 'cascade' }),
    dataInteresului: integer('data_interesului', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Locațiile marcate ca favorite de utilizatori
export const favoriteLocatii = sqliteTable('favorite_locatii', {
    id: text('id').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id, { onDelete: 'cascade' }),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie, { onDelete: 'cascade' }),
    dataAdaugarii: integer('data_adaugarii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Rezervările la evenimente gratuite cu intervale orare (ex: ture ghidate)
export const rezervariEvenimente = sqliteTable('rezervari_evenimente', {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull().references(() => evenimente.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    numeRezervant: text('nume_rezervant').notNull(),
    nrPersoane: integer('nr_persoane').notNull().default(1),
    ziuaAleasa: text('ziua_aleasa'), // string dată ISO
    intervalOrar: text('interval_orar'), // ex: '18:00-21:00'
    dataRezervare: integer('data_rezervare', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// Tabelele de Gamification
// ============================================

// Catalogul de insigne disponibile în platformă
export const insigne = sqliteTable('insigne', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),            // ex: "Critic de Artă"
    descriere: text('descriere'),
    iconita: text('iconita').notNull(),      // nume icon Lucide: 'Star', 'Trophy', 'Heart'
    conditie: text('conditie').notNull(),    // cod condiție: 'reviews_5', 'museums_3'
    valoareConditie: integer('valoare_conditie').notNull(),
    culoare: text('culoare').default('#9333ea'), // hex folosit pentru gradientul insignei
    mesajMotivatie: text('mesaj_motivatie'), // ex: "Lasă încă 3 recenzii pentru a obține insigna"
});

// Insignele câștigate de fiecare utilizator
export const insigneUtilizatori = sqliteTable('insigne_utilizatori', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    insignaId: text('insigna_id').notNull().references(() => insigne.id, { onDelete: 'cascade' }),
    dataObtinerii: integer('data_obtinerii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Catalogul de recompense disponibile (vouchere, bilete gratuite, reduceri)
export const recompense = sqliteTable('recompense', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),                   // ex: "Bilet gratuit Adult"
    descriere: text('descriere'),
    puncteNecesare: integer('puncte_necesare').notNull(),
    tip: text('tip').default('voucher'),             // 'bilet_gratuit', 'reducere', 'voucher'
    valoare: real('valoare'),                        // ex: 15 lei, 10%, sau 0 pentru bilet gratuit
    activ: integer('activ', { mode: 'boolean' }).default(true),
});

// Recompensele revendicate de utilizatori — fiecare are un cod voucher unic
export const recompenzeRevendicate = sqliteTable('recompense_revendicate', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    recompensaId: text('recompensa_id').notNull().references(() => recompense.id, { onDelete: 'cascade' }),
    dataRevendicarii: integer('data_revendicarii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    status: text('status').default('activ'),         // 'activ', 'folosit', 'expirat'
    codVoucher: text('cod_voucher').notNull().unique(), // UUID generat la momentul revendicării
    puncteCheltuite: integer('puncte_cheltuite').notNull(),
});

// ============================================
// Trasee Culturale (Gamification V2)
// ============================================

// Traseele culturale definite de superadmin — grupuri ordonate de locații vizitabile
export const trasee = sqliteTable('trasee', {
    id: text('id').primaryKey(),
    titlu: text('titlu').notNull(),
    descriere: text('descriere'),
    durataEstimata: integer('durata_estimata'), // în minute
    oras: text('oras'),
    imagineUrl: text('imagine_url'),
    activ: integer('activ', { mode: 'boolean' }).default(true),
    dataCreare: integer('data_creare', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

// Relația many-to-many între trasee și locații, cu ordinea de vizitare
export const traseeLocatii = sqliteTable('trasee_locatii', {
    id: text('id').primaryKey(),
    traseuId: text('traseu_id').notNull().references(() => trasee.id, { onDelete: 'cascade' }),
    codUnicLocatie: text('cod_unic_locatie').notNull().references(() => locatiiPublice.codUnicLocatie, { onDelete: 'cascade' }),
    ordine: integer('ordine').notNull().default(0) // 1, 2, 3... ordinea în traseu
});
