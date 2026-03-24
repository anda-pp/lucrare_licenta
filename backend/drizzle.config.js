import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './db/schema.js',
    out: './db/drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: './db/museum.db',
    },
    verbose: true,
    strict: true,
});
