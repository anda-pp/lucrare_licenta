# MuseumPass — Platformă de Management pentru Muzee și Spații Culturale

Aplicație web full-stack pentru gestionarea vizitelor la muzee, vânzare de bilete, programe de fidelitate, evenimente culturale și gamificare. Platforma oferă un ecosistem complet pentru muzee/galerii, administratori, personal și utilizatori.

## Cuprins

- [Tehnologii Utilizate](#tehnologii-utilizate)
- [Funcționalități](#funcționalități)
- [Structura Proiectului](#structura-proiectului)
- [Schema Bazei de Date](#schema-bazei-de-date)
- [Instalare și Configurare](#instalare-și-configurare)
- [Variabile de Mediu](#variabile-de-mediu)
- [Rute API](#rute-api)
- [Paginile Aplicației](#paginile-aplicației)
- [Autentificare și Autorizare](#autentificare-și-autorizare)
- [Sistem de Notificări Email](#sistem-de-notificări-email)

---

## Tehnologii Utilizate

### Backend
| Tehnologie | Rol |
|---|---|
| **Node.js + Express.js** | Server HTTP și API REST |
| **SQLite** (better-sqlite3) | Bază de date |
| **Drizzle ORM** | ORM type-safe cu migrări |
| **BetterAuth** | Autentificare session-based |
| **Zod** | Validare schema request body |
| **Stripe** | Procesare plăți online |
| **Nodemailer** | Trimitere emailuri (SMTP Mailtrap) |
| **PDFKit + QRCode** | Generare bilete PDF cu cod QR |
| **Multer** | Upload fișiere (imagini) |
| **UUID** | Generare identificatori unici |

### Frontend
| Tehnologie | Rol |
|---|---|
| **React 18** | Framework UI |
| **React Router DOM 7** | Rutare client-side |
| **Vite** | Build tool și dev server |
| **Axios** | Client HTTP |
| **Recharts** | Grafice și vizualizări date |
| **Lucide React** | Iconuri |
| **Stripe React** | Componente plată (PaymentElement) |
| **CSS vanilla** | Stilizare (variabile CSS, responsive) |

---

## Funcționalități

### Utilizatori (Clienți)
- Înregistrare și autentificare (email/parolă)
- Explorare muzee și galerii cu filtrare
- Vizualizare detalii locație (orar, descriere, hartă, galerie imagini)
- Cumpărare bilete cu mai multe tipuri (Adult, Elev, Student, Pensionar)
- Checkout cu suport coduri promoționale și plată Stripe
- Generare facturi PDF cu cod QR
- Scriere recenzii cu rating 1-5 stele pentru locații
- Card de fidelitate cu niveluri (BRONZE → SILVER → GOLD → PLATINUM)
- Acumulare puncte de loialitate la fiecare achiziție
- Revendicare recompense pe bază de puncte
- Insigne de gamificare (bazate pe activitate)
- Favorite pe locații și interese pe evenimente
- Rezervări la evenimente gratuite
- Trasee culturale tematice
- Noaptea Muzeelor — secțiune dedicată

### Admin Muzeu
- Dashboard cu metrici specifice muzeului
- Gestionare informații și setări muzeu
- Creare și administrare evenimente
- Gestionare tipuri bilete și prețuri
- Vizualizare rezervări și comenzi
- Monitorizare recenzii

### Superadmin
- Dashboard global cu analytics la nivel de sistem
- Management complet muzee/galerii (CRUD)
- Gestionare conturi utilizatori
- Administrare comenzi și venituri
- Moderare recenzii
- Gestionare niveluri card fidelitate
- Administrare evenimente la nivel global
- Catalog artiști
- Definire insigne și recompense
- Creare trasee culturale
- Creare conturi staff (Admin/Personal)
- Vizualizare vouchere
- Trimitere notificări Noaptea Muzeelor

### Staff (Personal)
- Acces la analytics detaliate
- Generare rapoarte muzeu
- Vizualizare date vizitatori

---

## Structura Proiectului

```
lucrare_licenta/
├── backend/
│   ├── controllers/          # Handlere request
│   ├── db/
│   │   ├── schema.js         # Schema completă bază de date
│   │   ├── db.js             # Setup Drizzle ORM + SQLite
│   │   ├── museum.db         # Fișier bază de date
│   │   ├── drizzle/          # Fișiere migrare
│   │   ├── seed.js           # Script populare date
│   │   └── seed-user-data.js # Populare date utilizatori
│   ├── lib/
│   │   ├── auth.js           # Configurare BetterAuth
│   │   └── mailer.js         # Serviciu email Nodemailer
│   ├── middleware/
│   │   ├── authMiddleware.js  # Verificare autentificare și roluri
│   │   └── validateBody.js    # Validare Zod pe request body
│   ├── routes/               # Rute API (users, locations, events, etc.)
│   ├── services/
│   │   └── loyaltyPoints.service.js  # Calcul puncte fidelitate
│   ├── validators/
│   │   └── schemas.js        # Scheme Zod pentru validare input
│   ├── uploads/              # Fișiere uploadate
│   ├── server.js             # Entry point Express
│   └── .env                  # Variabile de mediu
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Componente reutilizabile
│   │   │   │   ├── FormModal.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── SearchFilterBar.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── StarRating.jsx
│   │   │   │   ├── ChartCard.jsx
│   │   │   │   └── ...
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── MuseumAdminLayout.jsx
│   │   │   ├── StaffLayout.jsx
│   │   │   └── UserLayout.jsx
│   │   ├── pages/
│   │   │   ├── admin/        # Pagini superadmin
│   │   │   ├── museum-admin/ # Pagini admin muzeu
│   │   │   ├── staff/        # Pagini personal
│   │   │   └── users/        # Pagini utilizatori
│   │   ├── lib/auth.js       # Client BetterAuth React
│   │   ├── App.jsx           # Componenta principală cu rutare
│   │   └── main.jsx          # Entry point React
│   └── vite.config.js
└── .gitignore
```

---

## Schema Bazei de Date

### Tabele Autentificare (BetterAuth)
| Tabel | Descriere |
|---|---|
| `user` | Conturi utilizatori cu roluri (Utilizator, Admin, Personal, Superadmin) |
| `session` | Sesiuni active (expirare 7 zile) |
| `account` | Conturi provider OAuth |
| `verification` | Tokenuri verificare email |

### Tabele Core
| Tabel | Descriere |
|---|---|
| `locatii_publice` | Muzee și galerii (tip, nume, oraș, adresă, orar, status) |
| `imagini_locatii` | Imagini multiple per locație |
| `tipuri_bilete` | Tipuri bilete cu prețuri per locație/eveniment |
| `comenzi` | Comenzi (status plată, status comandă) |
| `bilete_cumparate` | Bilete individuale în comenzi |
| `facturi` | Facturi cu TVA |
| `recenzii` | Recenzii cu rating 1-5 stele |
| `evenimente` | Evenimente culturale (General, Expoziție, Workshop, Noaptea Muzeelor) |
| `rezervari_evenimente` | Rezervări la evenimente gratuite |
| `favorite_locatii` | Locații favorite ale utilizatorilor |
| `interese_evenimente` | Interese pe evenimente (stil Facebook) |

### Tabele Gamificare & Fidelitate
| Tabel | Descriere |
|---|---|
| `card_fidelitate` | Tipuri carduri (BRONZE, SILVER, GOLD, PLATINUM) |
| `carduri_clienti` | Carduri alocate utilizatorilor cu puncte acumulate |
| `insigne` | Definiții insigne cu condiții |
| `insigne_utilizatori` | Insigne câștigate per utilizator |
| `recompense` | Catalog recompense disponibile |
| `recompense_revendicate` | Recompense revendicate cu cod voucher |
| `trasee` | Trasee culturale tematice |
| `trasee_locatii` | Locații incluse în trasee (cu ordine) |

### Tabele Auxiliare
| Tabel | Descriere |
|---|---|
| `judete` | Județele României |
| `artisti` | Profiluri artiști cu biografie |

---

## Instalare și Configurare

### Cerințe
- **Node.js** >= 18
- **npm** >= 9

### Pași

```bash
# 1. Clonare repository
git clone <url-repository>
cd lucrare_licenta

# 2. Instalare dependențe backend
cd backend
npm install

# 3. Configurare variabile de mediu
# Copiază .env și completează valorile (vezi secțiunea Variabile de Mediu)

# 4. Generare și aplicare migrări bază de date
npm run db:generate
npm run db:push

# 5. (Opțional) Populare date de test
npm run db:seed
npm run seed-user-data

# 6. Pornire server backend
npm run dev          # development (cu auto-reload)
# sau
npm start            # producție

# 7. Instalare dependențe frontend (alt terminal)
cd ../frontend
npm install

# 8. Pornire frontend
npm run dev
```

### Accesare
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Drizzle Studio:** `npm run db:studio` (inspectare vizuală bază de date)

---

## Variabile de Mediu

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# BetterAuth
BETTER_AUTH_SECRET=<cheie-secreta-sesiuni>
BETTER_AUTH_URL=http://localhost:5000

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP Email (Mailtrap Sandbox)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<mailtrap-username>
SMTP_PASS=<mailtrap-password>
SMTP_FROM="MuseumPass" <noreply@museumpass.ro>
```

### Frontend (`frontend/.env`)

```env
VITE_STRIPE_PK=pk_test_...
```

---

## Rute API

### Autentificare
| Metodă | Rută | Descriere |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Înregistrare |
| POST | `/api/auth/sign-in/email` | Autentificare |
| POST | `/api/auth/sign-out` | Deconectare |
| GET | `/api/auth/get-session` | Obținere sesiune curentă |

### Utilizatori (`/api/users`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/me` | Da | Utilizator curent |
| POST | `/checkout` | Da | Plasare comandă bilete |
| POST | `/reviews` | Da | Adăugare recenzie locație |
| GET | `/my-orders` | Da | Comenzile mele |
| GET | `/my-orders/:id/ticket` | Da | Descărcare bilet PDF |
| GET | `/my-reviews` | Da | Recenziile mele |
| PUT | `/my-reviews/:id` | Da | Editare recenzie |
| DELETE | `/my-reviews/:id` | Da | Ștergere recenzie |
| GET | `/my-favorites` | Da | Locații favorite |
| POST | `/my-favorites/:locationId` | Da | Adaugă la favorite |
| DELETE | `/my-favorites/:locationId` | Da | Elimină din favorite |
| GET | `/my-interests` | Da | Interese evenimente |
| POST | `/my-interests/:eventId` | Da | Marchează interes |
| DELETE | `/my-interests/:eventId` | Da | Elimină interes |
| GET | `/my-card` | Da | Card fidelitate |
| GET | `/my-reservations` | Da | Rezervările mele |
| POST | `/events/:id/reserve` | Da | Rezervare eveniment gratuit |

### Locații (`/api/locations`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/` | Nu | Toate locațiile active |
| GET | `/:id` | Nu | Detalii locație |
| POST | `/` | Superadmin | Creare locație |
| PUT | `/:id` | Superadmin | Editare locație |
| DELETE | `/:id` | Superadmin | Ștergere locație |

### Evenimente (`/api/events`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/` | Nu | Toate evenimentele |
| GET | `/:id` | Nu | Detalii eveniment |
| POST | `/` | Superadmin | Creare eveniment |
| PUT | `/:id` | Superadmin | Editare eveniment |
| DELETE | `/:id` | Superadmin | Ștergere eveniment |

### Gamificare
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/api/badges/my` | Da | Insignele mele cu progres |
| GET | `/api/rewards` | Da | Catalog recompense |
| GET | `/api/rewards/my` | Da | Recompensele revendicate |
| POST | `/api/rewards/:id/claim` | Da | Revendicare recompensă |
| GET | `/api/trails` | Nu | Trasee culturale |

### Plăți (`/api/stripe`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| POST | `/create-payment-intent` | Da | Creare PaymentIntent Stripe |
| POST | `/webhook` | Nu* | Webhook confirmare plată |

### Admin Muzeu (`/api/museum-admin`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/dashboard` | Admin | Dashboard muzeu |
| GET | `/my-museum` | Admin | Profilul muzeului |
| POST | `/events` | Admin | Creare eveniment muzeu |
| GET | `/orders` | Admin | Comenzi muzeu |
| GET | `/reviews` | Admin | Recenzii muzeu |

### Superadmin (`/api/users/superadmin`)
| Metodă | Rută | Auth | Descriere |
|---|---|---|---|
| GET | `/staff` | Superadmin | Lista conturi staff |
| POST | `/staff` | Superadmin | Creare cont staff |
| PUT | `/staff/:id` | Superadmin | Editare cont staff |
| DELETE | `/staff/:id` | Superadmin | Ștergere cont staff |
| POST | `/notify-noaptea-muzeelor` | Superadmin | Trimitere notificări Noaptea Muzeelor |

---

## Paginile Aplicației

### Publice
| Rută | Pagina |
|---|---|
| `/` | Landing page |
| `/login` | Autentificare |
| `/register` | Înregistrare |
| `*` | 404 Not Found |

### Utilizator (`/user`)
| Rută | Pagina |
|---|---|
| `/user` | Dashboard utilizator |
| `/user/locations` | Explorare muzee/galerii |
| `/user/locations/:id` | Detalii locație + recenzii + bilete |
| `/user/events` | Explorare evenimente |
| `/user/events/:id` | Detalii eveniment |
| `/user/reserve/:eventId` | Rezervare eveniment gratuit |
| `/user/noaptea-muzeelor` | Noaptea Muzeelor |
| `/user/checkout` | Checkout cumpărare bilete |
| `/user/orders` | Istoricul comenzilor |
| `/user/reservations` | Rezervările mele |
| `/user/reviews` | Recenziile mele |
| `/user/loyalty` | Card de fidelitate |
| `/user/my-favorites` | Locații favorite |
| `/user/interests` | Interese evenimente |
| `/user/artists` | Catalog artiști |
| `/user/artists/:id` | Profil artist |
| `/user/badges` | Insigne câștigate |
| `/user/rewards` | Recompense disponibile |
| `/user/trails` | Trasee culturale |
| `/user/payment/success` | Confirmare plată |
| `/user/payment/cancel` | Anulare plată |

### Superadmin (`/superadmin`)
| Rută | Pagina |
|---|---|
| `/superadmin` | Dashboard admin |
| `/superadmin/locations` | Management muzee |
| `/superadmin/users` | Management utilizatori |
| `/superadmin/orders` | Toate comenzile |
| `/superadmin/reviews` | Moderare recenzii |
| `/superadmin/loyalty-cards` | Niveluri carduri |
| `/superadmin/events` | Management evenimente |
| `/superadmin/reservations` | Toate rezervările |
| `/superadmin/artists` | Catalog artiști |
| `/superadmin/rewards` | Catalog recompense |
| `/superadmin/badges` | Definire insigne |
| `/superadmin/trails` | Trasee culturale |
| `/superadmin/vouchers` | Vizualizare vouchere |
| `/superadmin/staff-accounts` | Conturi staff |

### Admin Muzeu (`/admin`)
| Rută | Pagina |
|---|---|
| `/admin` | Dashboard muzeu |
| `/admin/my-museum` | Setări muzeu |
| `/admin/events` | Evenimentele muzeului |
| `/admin/reservations` | Rezervări muzeu |
| `/admin/orders` | Bilete vândute |
| `/admin/reviews` | Recenzii muzeu |

### Staff (`/staff`)
| Rută | Pagina |
|---|---|
| `/staff` | Dashboard staff |
| `/staff/museum-reports` | Rapoarte detaliate |

---

## Autentificare și Autorizare

### Sistem
Aplicația folosește **BetterAuth** cu sesiuni server-side (cookie-based), stocate în SQLite.

### Roluri
| Rol | Nivel | Acces |
|---|---|---|
| **Utilizator** | 1 | Pagini user (cumpărare, recenzii, favorite) |
| **Personal** | 2 | + Rapoarte muzeu |
| **Admin** | 3 | + Management muzeu propriu |
| **Superadmin** | 4 | Acces complet la toate funcționalitățile |

### Middleware
- `requireAuth` — verifică sesiunea activă
- `requireSuperadmin` — necesită rol Superadmin
- `requireAdmin` — necesită Admin sau Superadmin
- `requireStaff` — necesită Personal, Admin sau Superadmin

### Flux Autentificare
1. Utilizatorul se înregistrează (`/register`) → cont creat + card fidelitate BRONZE automat
2. Login cu email/parolă → sesiune creată (7 zile)
3. Frontend verifică sesiunea via `useSession()` hook
4. Cererile API includ cookie-ul de sesiune (`withCredentials: true`)
5. Middleware-ul verifică sesiunea și atașează `req.user`

---

## Sistem de Notificări Email

Aplicația folosește **Nodemailer** cu **Mailtrap** (sandbox SMTP) pentru testare.

### Template-uri Email
Toate emailurile au design responsive cu gradient purple, branding MuseumPass și butoane call-to-action.

| Notificare | Trigger | Destinatari |
|---|---|---|
| **Confirmare comandă** | După checkout reușit | Utilizatorul care a comandat (+ PDF bilet atașat) |
| **Eveniment nou la favorit** | Creare eveniment nou | Utilizatorii care au locația la favorite |
| **Muzeu nou adăugat** | Creare locație activă | Toți utilizatorii |
| **Recompensă nouă** | Creare recompensă | Utilizatorii cu suficiente puncte |
| **Noaptea Muzeelor** | Trigger manual admin | Toți utilizatorii |

### Configurare
1. Creare cont pe [mailtrap.io](https://mailtrap.io) → Email Sandbox
2. Copiere credențiale SMTP în `backend/.env` (`SMTP_USER`, `SMTP_PASS`)
3. Emailurile trimise apar în inbox-ul virtual Mailtrap

---

## Scripturi Utile

### Backend
```bash
npm run dev              # Pornire server development (nodemon)
npm start                # Pornire server producție
npm run db:generate      # Generare migrări Drizzle
npm run db:push          # Aplicare migrări
npm run db:studio        # Drizzle Studio (UI bază de date)
npm run db:seed          # Populare date inițiale
npm run seed-user-data   # Populare date utilizatori test
```

### Frontend
```bash
npm run dev              # Pornire Vite dev server (port 3000)
npm run build            # Build producție
npm run preview          # Previzualizare build producție
```
