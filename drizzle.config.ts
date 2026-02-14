import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema/contact.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
