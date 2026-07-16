import { db } from '../db/db.js';
import { carduriClienti, cardFidelitate } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

// Adaugă puncte de fidelitate după o plată și upgradează cardul dacă s-a atins pragul
// Regula: 1 leu cheltuit = 1 punct. Upgradul se face automat la cel mai înalt nivel eligibil.
export async function updateUserLoyaltyPoints(userId, orderTotal) {
    try {
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
        const pointsToAdd = Math.floor(orderTotal); // rotunjim în jos
        const newPoints = (card.puncteAcumulate || 0) + pointsToAdd;

        // Luăm toate tipurile de card în ordine descrescătoare a punctelor
        // ca să găsim cel mai înalt nivel la care se califică userul
        const cardTypes = await db
            .select()
            .from(cardFidelitate)
            .orderBy(desc(cardFidelitate.puncteCard));

        let newCardType = card.tipUnicCard;
        for (const cardType of cardTypes) {
            if (newPoints >= cardType.puncteCard) {
                newCardType = cardType.tipUnicCard;
                break;
            }
        }

        // Actualizăm punctele și tipul cardului dacă s-a schimbat
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

// Returnează statusul complet al cardului de fidelitate al unui utilizator,
// inclusiv câte puncte mai are nevoie pentru nivelul următor
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

        // Găsim nivelul următor — primul card cu prag mai mare decât punctele curente
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
