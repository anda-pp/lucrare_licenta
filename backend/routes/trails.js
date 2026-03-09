import express from 'express';
import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';

const router = express.Router();

// GET /api/trails — trasee culturale sugerate, grupate pe oras
router.get('/', async (req, res) => {
    try {
        // Get all locations with their ratings
        const locRes = await db.run(sql`
            SELECT lp.cod_unic_locatie, lp.nume_loc, lp.oras_loc, lp.tip_locatie,
                   lp.adresa, lp.orar, lp.scurta_descriere,
                   ROUND(AVG(r.rating), 1) as rating_mediu,
                   COUNT(r.numar_recenzie) as nr_recenzii
            FROM locatii_publice lp
            LEFT JOIN recenzii r ON r.cod_unic_locatie = lp.cod_unic_locatie
            GROUP BY lp.cod_unic_locatie
            ORDER BY lp.oras_loc, rating_mediu DESC
        `);

        const locations = locRes.rows;

        // Group by city
        const byCity = {};
        for (const loc of locations) {
            const city = loc.oras_loc || 'Necunoscut';
            if (!byCity[city]) byCity[city] = [];
            byCity[city].push(loc);
        }

        // Build trail objects — only cities with at least 2 locations
        const DURATION_BY_TYPE = {
            'Muzeu': 90,      // minutes
            'Galerie': 60,
            'Centru Cultural': 45,
            'Muzeu Memorial': 60,
        };

        const trails = Object.entries(byCity)
            .filter(([, locs]) => locs.length >= 2)
            .map(([city, locs]) => {
                // Take top 4 locations by rating
                const selected = locs.slice(0, 4);
                const totalMinutes = selected.reduce((sum, loc) => {
                    return sum + (DURATION_BY_TYPE[loc.tip_locatie] ?? 75);
                }, 0);
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                const durata = mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
                const avgRating = selected.reduce((s, l) => s + (parseFloat(l.rating_mediu) || 0), 0) / selected.length;

                // Suggest weekend or day-trip label based on count
                const format = selected.length >= 4 ? 'Un weekend la' : 'O zi la';

                return {
                    id: `trail_${city.toLowerCase().replace(/\s/g, '_')}`,
                    titlu: `${format} ${city}`,
                    oras: city,
                    locatii: selected,
                    durata,
                    ratingMediu: parseFloat(avgRating.toFixed(1)),
                    totalMinute: totalMinutes,
                    nrLocatii: selected.length,
                };
            })
            .sort((a, b) => b.ratingMediu - a.ratingMediu); // Best-rated cities first

        res.json({ success: true, data: trails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

export default router;
