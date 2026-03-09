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

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// BetterAuth routes - IMPORTANT: Must be before other routes
app.all('/api/auth/*', async (req, res) => {
    try {
        // Convert Express request to Web Request
        const url = new URL(req.url, `http://${req.headers.host}`);

        // Prepare headers
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
        });

        // Prepare body
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

        // Convert Web Response to Express response
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

// API Routes
import usersRoutes from './routes/users.routes.js';
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

// Test Routes
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ceva nu a mers bine!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server pornit pe portul ${PORT}`);
    console.log(`📡 API disponibil la http://localhost:${PORT}/api`);
});
