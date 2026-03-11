import { db } from './db/db.js';
import { sql } from 'drizzle-orm';

async function test() {
    try {
        console.log("Testing db.run:");
        const r1 = await db.run(sql`SELECT COUNT(*) as cnt FROM user`);
        console.log("db.run result:", r1);

        console.log("\nTesting db.all:");
        const r2 = await db.all(sql`SELECT * FROM insigne LIMIT 1`);
        console.log("db.all result:", r2);

        console.log("\nTesting db.get:");
        const r3 = await db.get(sql`SELECT COUNT(*) as cnt FROM user`);
        console.log("db.get result:", r3);
    } catch (e) {
        console.error("Error:", e);
    }
}

test().then(() => process.exit(0));
