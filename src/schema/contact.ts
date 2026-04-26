import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contactTable = pgTable('module_contacts_contacts', {
  id: uuid('id').primaryKey().notNull(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  document_type: text('document_type'),
  document_number: text('document_number'),
  address: text('address'),
  notes: text('notes'),
  avatar_url: text('avatar_url'),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'),
  is_active: boolean('is_active').notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date().toISOString()),
});

export type ContactRow = typeof contactTable.$inferSelect;
export type NewContactRow = typeof contactTable.$inferInsert;
