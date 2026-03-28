import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.js";
import * as schema from "../db/schema.js";
import crypto from "crypto";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:3000",
    ].filter(Boolean),
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        minPasswordLength: 6,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "Utilizator",
                input: false,
            },
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Only assign Bronze card to users with Utilizator role
                    if (user.role !== 'Utilizator') {
                        console.log(`\u23ED\uFE0F Skipping card for non-Utilizator user ${user.email} (role: ${user.role})`);
                        return;
                    }

                    try {
                        await db.insert(schema.carduriClienti).values({
                            nrUnicCard: crypto.randomUUID(),
                            codUnicUtilizator: user.id,
                            tipUnicCard: 'BRONZE',
                        });
                        console.log(`\u2705 Bronze card assigned to user ${user.email}`);
                    } catch (error) {
                        console.error('Error assigning Bronze card:', error);
                    }
                },
            },
        },
    }
});
