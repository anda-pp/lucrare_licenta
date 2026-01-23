import { db } from '../db/db.js';
import { recenzii, user, locatiiPublice } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/reviews
 * Get all reviews with user and location info
 */
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await db
            .select({
                numarRecenzie: recenzii.numarRecenzie,
                descriereRecenzie: recenzii.descriereRecenzie,
                rating: recenzii.rating,
                dataRecenzie: recenzii.dataRecenzie,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                locationId: locatiiPublice.codUnicLocatie,
                locationName: locatiiPublice.numeLoc,
            })
            .from(recenzii)
            .leftJoin(user, eq(recenzii.codUnicUtilizator, user.id))
            .leftJoin(locatiiPublice, eq(recenzii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .orderBy(desc(recenzii.dataRecenzie));

        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua recenziile',
        });
    }
};

/**
 * DELETE /api/reviews/:id
 * Delete a review (Admin only)
 */
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if review exists
        const existing = await db
            .select()
            .from(recenzii)
            .where(eq(recenzii.numarRecenzie, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Recenzia nu a fost găsită',
            });
        }

        // Delete review
        await db.delete(recenzii).where(eq(recenzii.numarRecenzie, id));

        res.json({
            success: true,
            message: 'Recenzia a fost ștearsă',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut șterge recenzia',
        });
    }
};
