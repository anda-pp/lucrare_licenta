import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './db/schema.js',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: './museum.db',
    },
    verbose: true,
    strict: true,
});
