import { db } from '../db/db.js';
import { carduriClienti, cardFidelitate } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

/**
 * Update user loyalty points and upgrade card if threshold reached
 * @param {string} userId - User ID
 * @param {number} orderTotal - Order total in lei (1 lei = 1 point)
 */
export async function updateUserLoyaltyPoints(userId, orderTotal) {
    try {
        // Get user's card
        const userCard = await db
            .select()
            .from(carduriClienti)
            .where(eq(carduriClienti.codUnicUtilizator, userId))
            .limit(1);

        if (userCard.length === 0) {
            console.log(`No loyalty card found for user ${userId}`);
            return null;
        }

        const card = userCard[0];
        const pointsToAdd = Math.floor(orderTotal); // 1 lei = 1 point
        const newPoints = (card.puncteAcumulate || 0) + pointsToAdd;

        // Get all card types ordered by points (descending to find highest eligible)
        const cardTypes = await db
            .select()
            .from(cardFidelitate)
            .orderBy(desc(cardFidelitate.puncteCard));

        // Find the highest card type the user qualifies for
        let newCardType = card.tipUnicCard;
        for (const cardType of cardTypes) {
            if (newPoints >= cardType.puncteCard) {
                newCardType = cardType.tipUnicCard;
                break;
            }
        }

        // Update user's card with new points and potentially new card type
        await db
            .update(carduriClienti)
            .set({
                puncteAcumulate: newPoints,
                tipUnicCard: newCardType,
            })
            .where(eq(carduriClienti.nrUnicCard, card.nrUnicCard));

        const upgraded = newCardType !== card.tipUnicCard;

        console.log(`✅ Updated points for user ${userId}: +${pointsToAdd} points (Total: ${newPoints})`);
        if (upgraded) {
            console.log(`🎉 Card upgraded from ${card.tipUnicCard} to ${newCardType}!`);
        }

        return {
            previousPoints: card.puncteAcumulate || 0,
            newPoints,
            pointsAdded: pointsToAdd,
            previousCardType: card.tipUnicCard,
            newCardType,
            upgraded,
        };
    } catch (error) {
        console.error('Error updating loyalty points:', error);
        throw error;
    }
}

/**
 * Get user's current loyalty status
 * @param {string} userId - User ID
 */
export async function getUserLoyaltyStatus(userId) {
    try {
        const result = await db
            .select({
                nrUnicCard: carduriClienti.nrUnicCard,
                puncteAcumulate: carduriClienti.puncteAcumulate,
                tipUnicCard: carduriClienti.tipUnicCard,
                numeCard: cardFidelitate.numeCard,
                puncteCard: cardFidelitate.puncteCard,
            })
            .from(carduriClienti)
            .leftJoin(cardFidelitate, eq(carduriClienti.tipUnicCard, cardFidelitate.tipUnicCard))
            .where(eq(carduriClienti.codUnicUtilizator, userId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        // Get next card type
        const nextCard = await db
            .select()
            .from(cardFidelitate)
            .where(sql`${cardFidelitate.puncteCard} > ${result[0].puncteAcumulate || 0}`)
            .orderBy(cardFidelitate.puncteCard)
            .limit(1);

        return {
            ...result[0],
            nextCard: nextCard[0] || null,
            pointsToNextLevel: nextCard[0] ? nextCard[0].puncteCard - (result[0].puncteAcumulate || 0) : 0,
        };
    } catch (error) {
        console.error('Error getting loyalty status:', error);
        throw error;
    }
}
