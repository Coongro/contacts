import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contactTable = pgTable('module_contacts_contacts', {
  // La tabla genera su propia clave: un contacto se crea desde acá, desde el alta de
  // propietarios de `properties` y desde cualquier kit que sume gente. Depender de que
  // cada escritor se acuerde de pasar el UUID es frágil —ya rompió el alta de
  // propietarios— y no hay forma de garantizarlo desde este plugin.
  id: uuid('id').primaryKey().notNull().defaultRandom(),
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
  // Un contacto nace activo. Sin default, cada escritor externo tiene que saberlo:
  // `properties` ya lo descubrió a los golpes y lo dejó anotado en su insert.
  is_active: boolean('is_active').notNull().default(true),
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
