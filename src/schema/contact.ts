import { sql } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contactTable = pgTable(
  'module_contacts_contacts',
  {
    // La tabla genera su propia clave: un contacto se crea desde acá, desde el alta de
    // propietarios de `properties` y desde cualquier kit que sume gente. Depender de que
    // cada escritor se acuerde de pasar el UUID es frágil —ya rompió el alta de
    // propietarios— y no hay forma de garantizarlo desde este plugin.
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    // Rol o vocabulario de cada kit (owner, tenant, client...). No dice si es persona u
    // organización: eso es `kind`.
    type: text('type').notNull(),
    // Persona u organización. Con default porque hay kits que insertan directo en la
    // tabla (leases) y no saben que la columna existe.
    kind: text('kind').notNull().default('person'),
    // Nombre visible. Se mantiene aunque haya nombre y apellido por separado: todos los
    // consumidores leen `name`.
    name: text('name').notNull(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    job_title: text('job_title'),
    // Organización a la que pertenece una persona. Referencia lógica a otro contacto,
    // sin FK: una organización borrada no debe arrastrar a sus personas.
    organization_id: uuid('organization_id'),
    phone: text('phone'),
    email: text('email'),
    // El principal va en `phone`/`email`; los demás, acá.
    additional_phones: jsonb('additional_phones')
      .notNull()
      .default(sql`'[]'::jsonb`),
    additional_emails: jsonb('additional_emails')
      .notNull()
      .default(sql`'[]'::jsonb`),
    website: text('website'),
    linkedin: text('linkedin'),
    document_type: text('document_type'),
    document_number: text('document_number'),
    // Domicilio en texto libre, como lo cargan los kits existentes. La versión
    // estructurada convive con él; nadie la exige.
    address: text('address'),
    address_street: text('address_street'),
    address_city: text('address_city'),
    address_state: text('address_state'),
    address_postcode: text('address_postcode'),
    address_country: text('address_country'),
    // Responsable del contacto dentro del negocio (id de `staff`, sin FK entre plugins).
    owner_staff_id: text('owner_staff_id'),
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
  },
  // Índices sin unicidad: hay duplicados históricos de email y documento.
  (table) => [
    index('module_contacts_contacts_email_idx').on(table.email),
    index('module_contacts_contacts_document_number_idx').on(table.document_number),
    index('module_contacts_contacts_organization_id_idx').on(table.organization_id),
    index('module_contacts_contacts_kind_idx').on(table.kind),
    index('module_contacts_contacts_deleted_at_idx').on(table.deleted_at),
  ]
);

export type ContactRow = typeof contactTable.$inferSelect;
export type NewContactRow = typeof contactTable.$inferInsert;
