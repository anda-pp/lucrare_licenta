import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// BetterAuth Tables (Required for authentication)
// ============================================

// BetterAuth User table
export const user = sqliteTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    role: text('role').default('Utilizator'), // Superadmin, Admin, Personal, Utilizator
    muzeuId: text('muzeu_id'), // FK -> locatii_publice.cod_unic_locatie (constraint in DB)
    telefon: text('telefon'),
});

// BetterAuth Session table
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

// BetterAuth Account table
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

// BetterAuth Verification table
export const verification = sqliteTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// Application Tables
// ============================================


// Tabela Judete
export const judete = sqliteTable('judete', {
    codJudet: text('cod_judet').primaryKey(),
    numeJudet: text('nume_judet').notNull().unique(),
});

// Tabela Utilizatori
export const utilizatori = sqliteTable('utilizatori', {
    codUnicUtilizator: text('cod_unic_utilizator').primaryKey(),
    numeUtil: text('nume_util').notNull(),
    prenumeUtil: text('prenume_util').notNull(),
    emailUtil: text('email_util').notNull(),
    usernameUtil: text('username_util').notNull().unique(),
    parolaUtil: text('parola_util').notNull(),
    telefonUtil: text('telefon_util'),
    orasUtil: text('oras_util').notNull(),
    judetUtil: text('judet_util').references(() => judete.codJudet),
    adresaUtil: text('adresa_util').notNull(),
    rolUtil: text('rol_util', { enum: ['Superadmin', 'Admin', 'Utilizator', 'Personal'] }).notNull(),
    muzeuId: text('muzeu_id').references(() => locatiiPublice.codUnicLocatie),
    dataInregistrare: text('data_inregistrare').default(sql`CURRENT_TIMESTAMP`),
    avatarUrl: text('avatar_url'), // Pentru upload avatar
});

// Tabela Card Fidelitate (tipuri de carduri)
export const cardFidelitate = sqliteTable('card_fidelitate', {
    tipUnicCard: text('tip_unic_card').primaryKey(),
    numeCard: text('nume_card').notNull().unique(),
    puncteCard: integer('puncte_card').default(0),
    oferteSpeciale: text('oferte_speciale'),
    oferteBunVenit: text('oferte_bun_venit'),
});

// Tabela Carduri Clienti (carduri asociate utilizatorilor)
export const carduriClienti = sqliteTable('carduri_clienti', {
    nrUnicCard: text('nr_unic_card').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    tipUnicCard: text('tip_unic_card').references(() => cardFidelitate.tipUnicCard),
    puncteAcumulate: integer('puncte_acumulate').default(0),
});

// Tabela Locatii Publice (Muzee si Galerii)
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
    imagineUrl: text('imagine_url'), // Pentru upload imagine locatie
});

// Tabela Tipuri Bilete
export const tipuriBilete = sqliteTable('tipuri_bilete', {
    codUnicTipBilet: text('cod_unic_tip_bilet').primaryKey(),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
    codUnicEveniment: text('cod_unic_eveniment').references(() => evenimente.id), // FK catre evenimente.id (adaugat prin migrare)
    tipBilet: text('tip_bilet', { enum: ['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'] }).notNull(),
    pret: real('pret').notNull(),
});

// Tabela Favorite
export const favorite = sqliteTable('favorite', {
    numarFavorite: text('numar_favorite').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => utilizatori.codUnicUtilizator),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
});

// Tabela Recenzii
export const recenzii = sqliteTable('recenzii', {
    numarRecenzie: text('numar_recenzie').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie),
    descriereRecenzie: text('descriere_recenzie'),
    rating: integer('rating').notNull(), // 1-5
    dataRecenzie: text('data_recenzie').default(sql`CURRENT_TIMESTAMP`),
});

// Tabela Comenzi
export const comenzi = sqliteTable('comenzi', {
    numarComanda: integer('numar_comanda').primaryKey({ autoIncrement: true }),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id),
    totalPlata: real('total_plata').notNull(),
    dataComanda: text('data_comanda').default(sql`CURRENT_TIMESTAMP`),
    statusPlata: text('status_plata', { enum: ['Plătit', 'Eșuat', 'În așteptare'] }).notNull(),
    statusComanda: text('status_comanda', { enum: ['Activă', 'Anulată'] }).default('Activă'),
});

// Tabela Bilete Cumparate
export const bileteCumparate = sqliteTable('bilete_cumparate', {
    nrBiletCumparat: text('nr_bilet_cumparat').primaryKey(),
    codUnicTipBilet: text('cod_unic_tip_bilet').references(() => tipuriBilete.codUnicTipBilet),
    numarComanda: integer('numar_comanda').references(() => comenzi.numarComanda),
    cantitate: integer('cantitate').notNull(),
    dataVizita: text('data_vizita'),
});

// Tabela Facturi
export const facturi = sqliteTable('facturi', {
    numarFactura: integer('numar_factura').primaryKey({ autoIncrement: true }),
    numarComanda: integer('numar_comanda').references(() => comenzi.numarComanda),
    serieFactura: text('serie_factura').notNull(),
    dataFacturare: text('data_facturare').notNull(),
    tva: real('tva').default(0.19),
    totalFactura: real('total_factura').notNull(),
});

// Tabela Imagini Locatii (pentru upload multiple imagini per muzeu)
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

// Tabela Evenimente
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
    intervaleOrare: text('intervale_orare'), // Stocheaza un array JSON de stringuri: '["10:00-12:00"]'
});

// Tabela Artisti
export const artisti = sqliteTable('artisti', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),
    biografie: text('biografie'),
    interviu: text('interviu'), // Poate fi text lung sau link YouTube
    linkOpere: text('link_opere'), // Unde pot fi găsite operele
    imagineUrl: text('imagine_url'),
});

// Tabela Interese Evenimente (Facebook-style "Interested")
export const intereseEvenimente = sqliteTable('interese_evenimente', {
    id: text('id').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id, { onDelete: 'cascade' }),
    codUnicEveniment: text('cod_unic_eveniment').references(() => evenimente.id, { onDelete: 'cascade' }),
    dataInteresului: integer('data_interesului', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Tabela Favorite Locatii (legată de user BetterAuth)
export const favoriteLocatii = sqliteTable('favorite_locatii', {
    id: text('id').primaryKey(),
    codUnicUtilizator: text('cod_unic_utilizator').references(() => user.id, { onDelete: 'cascade' }),
    codUnicLocatie: text('cod_unic_locatie').references(() => locatiiPublice.codUnicLocatie, { onDelete: 'cascade' }),
    dataAdaugarii: integer('data_adaugarii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Tabela Rezervari Evenimente Gratuite
export const rezervariEvenimente = sqliteTable('rezervari_evenimente', {
    id: text('id').primaryKey(),
    eventId: text('event_id').notNull().references(() => evenimente.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    numeRezervant: text('nume_rezervant').notNull(),
    nrPersoane: integer('nr_persoane').notNull().default(1),
    ziuaAleasa: text('ziua_aleasa'), // ISO date string
    intervalOrar: text('interval_orar'), // ex: '18:00-21:00'
    dataRezervare: integer('data_rezervare', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// Gamification Tables
// ============================================

// Catalog de insigne disponibile
export const insigne = sqliteTable('insigne', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),            // "Critic de Artă"
    descriere: text('descriere'),
    iconita: text('iconita').notNull(),      // ex: 'Star', 'Trophy', 'Heart'
    conditie: text('conditie').notNull(),    // 'reviews_5', 'museums_3', etc.
    valoareConditie: integer('valoare_conditie').notNull(),
    culoare: text('culoare').default('#9333ea'), // hex pentru gradient badge
    mesajMotivatie: text('mesaj_motivatie'), // "Lasă încă X recenzii pentru a obține insigna"
});

// Insigne câștigate de utilizatori
export const insigneUtilizatori = sqliteTable('insigne_utilizatori', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    insignaId: text('insigna_id').notNull().references(() => insigne.id, { onDelete: 'cascade' }),
    dataObtinerii: integer('data_obtinerii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Catalog de recompense disponibile
export const recompense = sqliteTable('recompense', {
    id: text('id').primaryKey(),
    nume: text('nume').notNull(),                   // "Bilet gratuit Adult"
    descriere: text('descriere'),
    puncteNecesare: integer('puncte_necesare').notNull(),
    tip: text('tip').default('voucher'),             // 'bilet_gratuit', 'reducere', 'voucher'
    valoare: real('valoare'),                        // ex: 15 (lei), 10 (%), 0 (bilet gratuit)
    activ: integer('activ', { mode: 'boolean' }).default(true),
});

// Recompense revendicate de utilizatori
export const recompenzeRevendicate = sqliteTable('recompense_revendicate', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    recompensaId: text('recompensa_id').notNull().references(() => recompense.id, { onDelete: 'cascade' }),
    dataRevendicarii: integer('data_revendicarii', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    status: text('status').default('activ'),         // 'activ', 'folosit', 'expirat'
    codVoucher: text('cod_voucher').notNull().unique(), // UUID generat la claim
    puncteCheltuite: integer('puncte_cheltuite').notNull(),
});

// ============================================
// Custom Cultural Trails (Gamification V2)
// ============================================

// Tabela Principală a Traseului
export const trasee = sqliteTable('trasee', {
    id: text('id').primaryKey(), // UUID
    titlu: text('titlu').notNull(),
    descriere: text('descriere'),
    durataEstimata: integer('durata_estimata'), // în minute
    oras: text('oras'),
    imagineUrl: text('imagine_url'),
    activ: integer('activ', { mode: 'boolean' }).default(true),
    dataCreare: integer('data_creare', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

// Tabela de Legătură: Ce locații intră într-un traseu și în ce ordine
export const traseeLocatii = sqliteTable('trasee_locatii', {
    id: text('id').primaryKey(), // UUID
    traseuId: text('traseu_id').notNull().references(() => trasee.id, { onDelete: 'cascade' }),
    codUnicLocatie: text('cod_unic_locatie').notNull().references(() => locatiiPublice.codUnicLocatie, { onDelete: 'cascade' }),
    ordine: integer('ordine').notNull().default(0) // 1, 2, 3...
});

