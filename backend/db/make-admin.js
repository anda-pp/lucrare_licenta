import { db } from './db.js';
import { user, carduriClienti } from './schema.js';
import { eq } from 'drizzle-orm';

/**
 * Script to make a user admin by email
 * Usage: node db/make-admin.js <email>
 */

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node db/make-admin.js <email>');
    process.exit(1);
}

async function makeAdmin() {
    try {
        console.log(`🔍 Looking for user with email: ${email}`);

        // Find user
        const users = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (users.length === 0) {
            console.error(`❌ User with email ${email} not found`);
            console.log('Please register this user first at http://localhost:3000/register');
            process.exit(1);
        }

        const foundUser = users[0];
        console.log(`✅ Found user: ${foundUser.name}`);

        // Update role to Admin
        await db
            .update(user)
            .set({ role: 'Admin' })
            .where(eq(user.id, foundUser.id));

        console.log(`🎉 Successfully made ${foundUser.name} an admin!`);
        console.log(`   Email: ${foundUser.email}`);
        console.log(`   Role: Admin`);

        // Delete loyalty card if exists (Admins don't get loyalty cards)
        const deleted = await db
            .delete(carduriClienti)
            .where(eq(carduriClienti.codUnicUtilizator, foundUser.id));

        console.log(`🗑️ Loyalty card removed (Admins don't participate in loyalty program)`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

makeAdmin()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });

