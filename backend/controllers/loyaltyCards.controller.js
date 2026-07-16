import { db } from '../db/db.js';
import { cardFidelitate } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Returnează toate tipurile de carduri de fidelitate disponibile în platformă
export const getAllLoyaltyCards = async (req, res) => {
    try {
        const cards = await db.select().from(cardFidelitate);

        res.json({
            success: true,
            count: cards.length,
            data: cards,
        });
    } catch (error) {
        console.error('Get loyalty cards error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua cardurile de fidelitate',
        });
    }
};

// Returnează un tip de card de fidelitate după ID (tipUnicCard)
export const getLoyaltyCardById = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await db
            .select()
            .from(cardFidelitate)
            .where(eq(cardFidelitate.tipUnicCard, id))
            .limit(1);

        if (card.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cardul nu a fost găsit',
            });
        }

        res.json({
            success: true,
            data: card[0],
        });
    } catch (error) {
        console.error('Get loyalty card error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut prelua cardul',
        });
    }
};

// Creare tip nou de card de fidelitate
// ID-ul (tipUnicCard) se generează automat din numele cardului (uppercase + underscore)
export const createLoyaltyCard = async (req, res) => {
    try {
        const { numeCard, puncteCard, oferteSpeciale, oferteBunVenit } = req.body;

        if (!numeCard) {
            return res.status(400).json({
                success: false,
                error: 'Numele cardului este obligatoriu',
            });
        }

        const tipUnicCard = numeCard.toUpperCase().replace(/\s+/g, '_');

        await db.insert(cardFidelitate).values({
            tipUnicCard,
            numeCard,
            puncteCard: puncteCard || 0,
            oferteSpeciale: oferteSpeciale || null,
            oferteBunVenit: oferteBunVenit || null,
        });

        res.status(201).json({
            success: true,
            message: 'Cardul a fost creat cu succes',
            data: { tipUnicCard },
        });
    } catch (error) {
        // Dacă numele cardului există deja, SQLite aruncă UNIQUE constraint error
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({
                success: false,
                error: 'Un card cu acest nume există deja',
            });
        }

        console.error('Create loyalty card error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut crea cardul',
        });
    }
};

// Editare tip de card — actualizăm câmpurile furnizate, păstrăm valorile existente pentru cele lipsă
export const updateLoyaltyCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeCard, puncteCard, oferteSpeciale, oferteBunVenit } = req.body;

        const existing = await db
            .select()
            .from(cardFidelitate)
            .where(eq(cardFidelitate.tipUnicCard, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cardul nu a fost găsit',
            });
        }

        await db
            .update(cardFidelitate)
            .set({
                numeCard: numeCard || existing[0].numeCard,
                puncteCard: puncteCard ?? existing[0].puncteCard,
                oferteSpeciale: oferteSpeciale ?? existing[0].oferteSpeciale,
                oferteBunVenit: oferteBunVenit ?? existing[0].oferteBunVenit,
            })
            .where(eq(cardFidelitate.tipUnicCard, id));

        res.json({
            success: true,
            message: 'Cardul a fost actualizat cu succes',
        });
    } catch (error) {
        console.error('Update loyalty card error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut actualiza cardul',
        });
    }
};

// Ștergere tip de card de fidelitate
export const deleteLoyaltyCard = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db
            .select()
            .from(cardFidelitate)
            .where(eq(cardFidelitate.tipUnicCard, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cardul nu a fost găsit',
            });
        }

        await db.delete(cardFidelitate).where(eq(cardFidelitate.tipUnicCard, id));

        res.json({
            success: true,
            message: 'Cardul a fost șters cu succes',
        });
    } catch (error) {
        console.error('Delete loyalty card error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut șterge cardul',
        });
    }
};
