// --- START api/drizzle.config.ts --- //
// Drizzle ORM configuration for AI-InterviewSpark
// Handles database migrations and schema management

import { defineConfig } from 'drizzle-kit';
import { config } from './src/config';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.database.url,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
}); 