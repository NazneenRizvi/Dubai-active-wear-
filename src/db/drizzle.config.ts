import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running db:push.');
export default defineConfig({
  schema: './src/db/schema.ts', out: './drizzle', dialect: 'postgresql',
  schemaFilter: ['public'], dbCredentials: { url: process.env.DATABASE_URL },
});
