import express from 'express';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { user, account } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { auth } from '../lib/auth.js';

const router = express.Router();

/**
 * GET /api/superadmin/staff
 * Obține lista tuturor Adminilor și Personalului
 */
router.get('/staff', requireSuperadmin, async (req, res) => {
    try {
        const staffList = await db.select({
            codUnicUtilizator: user.id,
            numeUtil: user.name,
            prenumeUtil: sql`''`.as('prenumeUtil'),
            emailUtil: user.email,
            usernameUtil: sql`''`.as('usernameUtil'),
            rolUtil: user.role,
            telefonUtil: user.telefon,
            muzeuId: user.muzeuId,
            dataInregistrare: user.createdAt,
        })
            .from(user)
            .where(sql`${user.role} IN ('Admin', 'Personal')`);

        res.json({ success: true, staff: staffList });
    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea staff-ului: ' + error.message });
    }
});

/**
 * POST /api/superadmin/staff
 * Creează un nou cont de Admin/Personal pentru un muzeu (LocatiePublica)
 */
router.post('/staff', requireAuth, requireSuperadmin, async (req, res) => {
    try {
        const { nume, prenume, email, telefon, password, rol, muzeuId } = req.body;

        if (!nume || !prenume || !email || !password || !rol) {
            return res.status(400).json({ success: false, error: 'Toate câmpurile principale sunt obligatorii.' });
        }
        if (rol !== 'Admin' && rol !== 'Personal') {
            return res.status(400).json({ success: false, error: 'Rol invalid.' });
        }

        // Verifică email unic
        const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Există deja un cont cu acest email.' });
        }

        // Creare cont prin BetterAuth (parolă hash corect)
        let authRes;
        try {
            authRes = await auth.api.signUpEmail({
                body: { email, password, name: `${nume} ${prenume}` }
            });
        } catch (e) { throw new Error('Eroare creare cont: ' + e.message); }

        const newUserId = authRes.user.id;

        // Setează rol, muzeu și telefon
        await db.update(user)
            .set({ role: rol, muzeuId: muzeuId || null, telefon: telefon || null })
            .where(eq(user.id, newUserId));

        res.json({ success: true, message: 'Contul a fost creat cu succes.' });
    } catch (error) {
        console.error('Error creating staff account:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea contului: ' + error.message });
    }
});

router.put('/staff/:id', requireAuth, requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nume, prenume, telefon, rol, muzeuId } = req.body;

        if (rol !== 'Admin' && rol !== 'Personal') {
            return res.status(400).json({ success: false, error: 'Rol invalid.' });
        }

        const existing = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Contul nu a fost găsit.' });
        }

        await db.update(user)
            .set({
                name: `${nume} ${prenume}`,
                role: rol,
                telefon: telefon || null,
                muzeuId: muzeuId || null,
            })
            .where(eq(user.id, id));

        res.json({ success: true, message: 'Contul a fost actualizat cu succes.' });
    } catch (error) {
        console.error('Error updating staff account:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea contului: ' + error.message });
    }
});

router.delete('/staff/:id', requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Contul nu a fost găsit.' });
        }

        // Dezactivăm FK temporar pentru a evita cascade-uri din sesiuni active
        await db.run(sql`PRAGMA foreign_keys = OFF`);
        try {
            await db.delete(account).where(eq(account.userId, id)).run();
            await db.delete(user).where(eq(user.id, id)).run();
        } finally {
            await db.run(sql`PRAGMA foreign_keys = ON`);
        }

        res.json({ success: true, message: 'Contul a fost șters cu succes.' });
    } catch (error) {
        console.error('Error deleting staff account:', error);
        await db.run(sql`PRAGMA foreign_keys = ON`);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea contului: ' + error.message });
    }
});

export default router;
