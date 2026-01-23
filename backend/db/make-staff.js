import { db } from './db.js';
import { user, carduriClienti } from './schema.js';
import { eq } from 'drizzle-orm';

/**
 * Script to make a user a staff member (Personal) by email
 * Usage: node db/make-staff.js <email>
 */

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npm run make-staff <email>');
    process.exit(1);
}

async function makeStaff() {
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

        // Update role to Personal
        await db
            .update(user)
            .set({ role: 'Personal' })
            .where(eq(user.id, foundUser.id));

        console.log(`🎉 Successfully made ${foundUser.name} a staff member!`);
        console.log(`   Email: ${foundUser.email}`);
        console.log(`   Role: Personal`);

        // Delete loyalty card if exists (Staff don't get loyalty cards)
        await db
            .delete(carduriClienti)
            .where(eq(carduriClienti.codUnicUtilizator, foundUser.id));

        console.log(`🗑️ Loyalty card removed (Staff don't participate in loyalty program)`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

makeStaff()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });

