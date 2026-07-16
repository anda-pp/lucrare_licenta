import { db } from '../db/db.js';
import { comenzi, user, locatiiPublice, bileteCumparate, tipuriBilete, facturi } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Returnează toate comenzile din platformă cu informații despre utilizator
export const getAllOrders = async (req, res) => {
    try {
        const orders = await db
            .select({
                numarComanda: comenzi.numarComanda,
                totalPlata: comenzi.totalPlata,
                dataComanda: comenzi.dataComanda,
                statusPlata: comenzi.statusPlata,
                statusComanda: comenzi.statusComanda,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
            })
            .from(comenzi)
            .leftJoin(user, eq(comenzi.codUnicUtilizator, user.id))
            .orderBy(desc(comenzi.numarComanda));

        res.json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua comenzile',
        });
    }
};

// Returnează detaliile unei comenzi specifice: biletele cumpărate și factura aferentă
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await db
            .select({
                numarComanda: comenzi.numarComanda,
                totalPlata: comenzi.totalPlata,
                dataComanda: comenzi.dataComanda,
                statusPlata: comenzi.statusPlata,
                statusComanda: comenzi.statusComanda,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
            })
            .from(comenzi)
            .leftJoin(user, eq(comenzi.codUnicUtilizator, user.id))
            .where(eq(comenzi.numarComanda, parseInt(id)))
            .limit(1);

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Comanda nu a fost găsită',
            });
        }

        // Biletele individuale din comandă cu tipul, prețul și locația
        const tickets = await db
            .select({
                nrBiletCumparat: bileteCumparate.nrBiletCumparat,
                cantitate: bileteCumparate.cantitate,
                tipBilet: tipuriBilete.tipBilet,
                pret: tipuriBilete.pret,
                numeLoc: locatiiPublice.numeLoc,
            })
            .from(bileteCumparate)
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .leftJoin(locatiiPublice, eq(tipuriBilete.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(bileteCumparate.numarComanda, parseInt(id)));

        const invoice = await db
            .select()
            .from(facturi)
            .where(eq(facturi.numarComanda, parseInt(id)))
            .limit(1);

        res.json({
            success: true,
            data: {
                ...order[0],
                tickets,
                invoice: invoice[0] || null,
            },
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut prelua comanda',
        });
    }
};

// Actualizează statusul unei comenzi (Activă ↔ Anulată) — numai admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusComanda } = req.body;

        if (!['Activă', 'Anulată'].includes(statusComanda)) {
            return res.status(400).json({
                success: false,
                error: 'Status invalid. Trebuie să fie "Activă" sau "Anulată"',
            });
        }

        const currentOrder = await db
            .select()
            .from(comenzi)
            .where(eq(comenzi.numarComanda, parseInt(id)))
            .limit(1);

        if (currentOrder.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Comanda nu a fost găsită',
            });
        }

        await db
            .update(comenzi)
            .set({ statusComanda })
            .where(eq(comenzi.numarComanda, parseInt(id)));

        res.json({
            success: true,
            message: `Comanda a fost ${statusComanda === 'Anulată' ? 'anulată' : 'reactivată'}`,
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut actualiza statusul',
        });
    }
};
