import express from 'express';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { user, account, evenimente, locatiiPublice } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { auth } from '../lib/auth.js';
import { hashPassword } from 'better-auth/crypto';
import { sendNoapteaMuzeelorReminder } from '../lib/mailer.js';

const router = express.Router();

// Listează toți utilizatorii cu rol Admin sau Personal
router.get('/staff', requireSuperadmin, async (req, res) => {
    try {
        // Extragem prenumele și numele din câmpul `name` al BetterAuth prin SQL
        const staffList = await db.select({
            codUnicUtilizator: user.id,
            numeUtil: sql`CASE WHEN instr(${user.name}, ' ') > 0 THEN substr(${user.name}, 1, instr(${user.name}, ' ') - 1) ELSE ${user.name} END`.as('numeUtil'),
            prenumeUtil: sql`CASE WHEN instr(${user.name}, ' ') > 0 THEN substr(${user.name}, instr(${user.name}, ' ') + 1) ELSE '' END`.as('prenumeUtil'),
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
        res.status(500).json({ success: false, error: 'Eroare la preluarea staff-ului.' });
    }
});

// Creare cont nou de Admin sau Personal pentru un muzeu specific
// Contul se creează prin BetterAuth (pentru hash corect al parolei), după care
// actualizăm manual rolul, muzeuId și telefonul din tabela user
router.post('/staff', requireAuth, requireSuperadmin, async (req, res) => {
    try {
        const { nume, prenume, email, telefon, password, rol, muzeuId } = req.body;

        if (!nume || !prenume || !email || !password || !rol) {
            return res.status(400).json({ success: false, error: 'Toate câmpurile principale sunt obligatorii.' });
        }
        if (rol !== 'Admin' && rol !== 'Personal') {
            return res.status(400).json({ success: false, error: 'Rol invalid.' });
        }

        // Verificăm că emailul nu există deja
        const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Există deja un cont cu acest email.' });
        }

        let authRes;
        try {
            authRes = await auth.api.signUpEmail({
                body: { email, password, name: `${nume} ${prenume}` }
            });
        } catch (e) {
            console.error('BetterAuth signUpEmail error:', e);
            throw new Error('Eroare creare cont');
        }

        const newUserId = authRes.user.id;

        // Setăm rolul, muzeul alocat și telefonul după ce contul BetterAuth a fost creat
        await db.update(user)
            .set({ role: rol, muzeuId: muzeuId || null, telefon: telefon || null })
            .where(eq(user.id, newUserId));

        res.json({ success: true, message: 'Contul a fost creat cu succes.' });
    } catch (error) {
        console.error('Error creating staff account:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea contului.' });
    }
});

// Editare cont de staff — actualizăm datele și, dacă s-a furnizat, parola (cu hash)
router.put('/staff/:id', requireAuth, requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nume, prenume, email, password, telefon, rol, muzeuId } = req.body;

        if (rol !== 'Admin' && rol !== 'Personal') {
            return res.status(400).json({ success: false, error: 'Rol invalid.' });
        }

        const existing = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Contul nu a fost găsit.' });
        }

        // Dacă emailul s-a schimbat, verificăm să nu fie deja folosit
        if (email && email !== existing[0].email) {
            const duplicate = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
            if (duplicate.length > 0) {
                return res.status(400).json({ success: false, error: 'Există deja un cont cu acest email.' });
            }
        }

        const updateFields = {
            name: `${nume} ${prenume}`,
            role: rol,
            telefon: telefon || null,
            muzeuId: muzeuId || null,
        };
        if (email && email !== existing[0].email) {
            updateFields.email = email;
        }

        await db.update(user)
            .set(updateFields)
            .where(eq(user.id, id));

        // Actualizăm parola direct în tabela account (cu hash din better-auth)
        if (password && password.trim().length >= 6) {
            const hashedPassword = await hashPassword(password);
            await db.update(account)
                .set({ password: hashedPassword })
                .where(eq(account.userId, id));
        }

        res.json({ success: true, message: 'Contul a fost actualizat cu succes.' });
    } catch (error) {
        console.error('Error updating staff account:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea contului.' });
    }
});

// Ștergere cont de staff — dezactivăm temporar FK pentru a evita erori de cascade din sesiuni active
router.delete('/staff/:id', requireSuperadmin, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Contul nu a fost găsit.' });
        }

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
        res.status(500).json({ success: false, error: 'Eroare la ștergerea contului.' });
    }
});

// Declanșare manuală a notificărilor pentru Noaptea Muzeelor
// Găsim toate evenimentele de tip Noaptea Muzeelor viitoare și trimitem email tuturor utilizatorilor
router.post('/notify-noaptea-muzeelor', requireSuperadmin, async (req, res) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const nmEvents = await db.select({
            titlu: evenimente.titlu,
            dataStart: evenimente.dataStart,
            locationName: locatiiPublice.numeLoc,
        })
            .from(evenimente)
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(evenimente.tipEveniment, 'Noaptea Muzeelor'));

        const upcomingEvents = nmEvents.filter(e => {
            const ts = e.dataStart instanceof Date ? e.dataStart.getTime() / 1000 : e.dataStart;
            return ts > now;
        });

        if (upcomingEvents.length === 0) {
            return res.json({ success: false, error: 'Nu există evenimente Noaptea Muzeelor viitoare.' });
        }

        const allUsers = await db.select({ email: user.email })
            .from(user).where(eq(user.role, 'Utilizator'));

        let sent = 0;
        for (const u of allUsers) {
            if (!u.email) continue;
            for (const ev of upcomingEvents) {
                try {
                    await sendNoapteaMuzeelorReminder(u.email, {
                        eventTitle: ev.titlu,
                        locationName: ev.locationName || '',
                        dataStart: ev.dataStart,
                    });
                    sent++;
                } catch (e) {
                    console.error(`NM email to ${u.email} failed:`, e.message);
                }
            }
        }

        res.json({ success: true, message: `Notificări trimise: ${sent} emailuri.` });
    } catch (error) {
        console.error('Noaptea Muzeelor notification error:', error);
        res.status(500).json({ success: false, error: 'Eroare la trimiterea notificărilor.' });
    }
});

export default router;
