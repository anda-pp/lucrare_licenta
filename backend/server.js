import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { auth } from './lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Permitem cereri de la frontend-ul nostru React, cu credențiale (cookies de sesiune)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Stripe webhook-ul are nevoie de body-ul brut (raw), înainte ca express.json() să-l parseze
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servim fișierele uploadate (imagini locații etc.) ca resurse statice
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutele BetterAuth trebuie să vină înainte de orice altă rută
// Convertim request-ul Express în Web Request standard pentru handler-ul BetterAuth
app.all('/api/auth/*', async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);

        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
        });

        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = JSON.stringify(req.body);
        }

        const webRequest = new Request(url, {
            method: req.method,
            headers: headers,
            body: body,
        });

        const response = await auth.handler(webRequest);

        // Convertim răspunsul Web Response înapoi la Express response
        res.status(response.status);
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        const responseBody = await response.text();
        res.send(responseBody);
    } catch (error) {
        console.error('BetterAuth handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Importăm și înregistrăm toate rutele aplicației
import usersRoutes from './routes/users.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import adminRoutes from './routes/admin.routes.js';
import loyaltyCardsRoutes from './routes/loyaltyCards.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import staffRoutes from './routes/staff.routes.js';
import marketingReportsRoutes from './routes/marketingReports.routes.js';
import directorReportsRoutes from './routes/directorReports.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import eventsRoutes from './routes/events.routes.js';
import artistsRoutes from './routes/artists.routes.js';
import badgesRoutes from './routes/badges.js';
import rewardsRoutes from './routes/rewards.js';
import trailsRoutes from './routes/trails.js';
import stripeRoutes from './routes/stripe.routes.js';
import museumAdminRoutes from './routes/museum-admin.routes.js';

app.use('/api/users', usersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/loyalty-cards', loyaltyCardsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports/marketing', marketingReportsRoutes);
app.use('/api/reports/director', directorReportsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/trails', trailsRoutes);
app.use('/api/users/superadmin', superadminRoutes);
app.use('/api/museum-admin', museumAdminRoutes);
app.use('/api/stripe', stripeRoutes);

// Rute de test — utile în development pentru a verifica că serverul răspunde
app.get('/api', (req, res) => {
    res.json({ message: 'Bine ai venit la API-ul aplicației de licență!' });
});

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend funcționează corect!',
        timestamp: new Date().toISOString()
    });
});

// Middleware global de tratare erori — prinde orice excepție nehandled
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ceva nu a mers bine!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server pornit pe portul ${PORT}`);
    console.log(`📡 API disponibil la http://localhost:${PORT}/api`);
});
