/**
 * Acciones de contacts: el contrato que el Core valida y expone.
 *
 * Cada acción declara qué acepta (lo que no está, se rechaza: nadie escribe
 * `created_at` ni `deleted_at` desde afuera) y delega en el repositorio.
 *
 * Forma de las respuestas: un registro es un objeto (no `[registro]`) y los
 * listados paginables vienen como `{ items, total }`. Los que todavía llaman
 * como antes reciben la forma vieja mientras la acción declare `legacy`.
 */

import { createInsertSchema, mutation, query, z, type Page } from '@coongro/plugin-sdk/actions';

import { ContactRepository } from './repositories/contact.repository.js';
import { contactTable, type ContactRow } from './schema/contact.js';

/** Las columnas que se escriben desde afuera. Las de sistema y la calculada, no. */
const WRITABLE = {
  type: true,
  kind: true,
  name: true,
  first_name: true,
  last_name: true,
  job_title: true,
  organization_id: true,
  phone: true,
  email: true,
  additional_phones: true,
  additional_emails: true,
  website: true,
  linkedin: true,
  document_type: true,
  document_number: true,
  address: true,
  address_street: true,
  address_city: true,
  address_state: true,
  address_postcode: true,
  address_country: true,
  owner_staff_id: true,
  notes: true,
  avatar_url: true,
  tags: true,
  metadata: true,
  is_active: true,
} as const;

/** Las columnas JSON, con su forma real (la tabla solo dice `jsonb`). */
const JsonColumns = {
  additional_phones: z.array(z.string()).optional(),
  additional_emails: z.array(z.string()).optional(),
  tags: z.array(z.string()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
};

const contactInsert = createInsertSchema(contactTable);

/** Alta: lo escribible más un `id` opcional (hay kits que lo generan ellos). */
const ContactCreate = contactInsert
  .pick({ ...WRITABLE, id: true })
  .extend(JsonColumns)
  .strict();

/** Edición: cualquier subconjunto de lo escribible. */
const ContactPatch = contactInsert.pick(WRITABLE).extend(JsonColumns).partial().strict();

const Id = z.guid();
const ById = z.object({ id: Id }).strict();
const Paging = {
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
};

const SearchInput = z
  .object({
    query: z.string().optional(),
    type: z.string().optional(),
    kind: z.string().optional(),
    organizationId: Id.optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    includeDeleted: z.boolean().optional(),
    orderBy: z.string().optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
    ...Paging,
  })
  .strict();

const destructive = mutation.meta({ effect: 'destructive' });

export const contactActions = {
  list: query
    .meta({ legacy: 'items' })
    .input(z.object(Paging).strict().optional())
    .handler(async ({ input = {}, context }): Promise<Page<ContactRow>> => {
      const repo = context.repo(ContactRepository);
      const items = await repo.list(input);
      // Sin límite vino la agenda entera: el total es lo que vino.
      const total = input.limit ? await repo.count() : items.length;
      return { items, total };
    }),

  search: query
    .meta({ legacy: 'items' })
    .input(SearchInput)
    .handler(async ({ input, context }): Promise<Page<ContactRow>> => {
      const repo = context.repo(ContactRepository);
      const [items, total] = await Promise.all([repo.search(input), repo.countSearch(input)]);
      return { items, total };
    }),

  getById: query
    .input(ById)
    .handler(
      async ({ input, context }) => (await context.repo(ContactRepository).getById(input)) ?? null
    ),

  findByDocument: query
    .input(z.object({ documentType: z.string(), documentNumber: z.string() }).strict())
    .handler(
      async ({ input, context }) =>
        (await context.repo(ContactRepository).findByDocument(input)) ?? null
    ),

  findByEmail: query
    .input(z.object({ email: z.string() }).strict())
    .handler(
      async ({ input, context }) =>
        (await context.repo(ContactRepository).findByEmail(input)) ?? null
    ),

  findByTag: query
    .input(z.object({ tag: z.string() }).strict())
    .handler(({ input, context }) => context.repo(ContactRepository).findByTag(input)),

  listTags: query.handler(({ context }) => context.repo(ContactRepository).listTags()),

  listByOrganization: query
    .input(z.object({ organizationId: Id }).strict())
    .handler(({ input, context }) => context.repo(ContactRepository).listByOrganization(input)),

  count: query
    .input(
      z
        .object({
          type: z.string().optional(),
          kind: z.string().optional(),
          includeDeleted: z.boolean().optional(),
        })
        .strict()
        .optional()
    )
    .handler(({ input, context }) => context.repo(ContactRepository).count(input)),

  countByType: query.handler(({ context }) => context.repo(ContactRepository).countByType()),

  findDuplicates: query
    .input(
      z
        .object({
          id: Id,
          minScore: z.number().optional(),
          limit: z.number().int().positive().optional(),
        })
        .strict()
    )
    .handler(({ input, context }) => context.repo(ContactRepository).findDuplicates(input)),

  scanDuplicates: query
    .input(
      z
        .object({ kind: z.string().optional(), minScore: z.number().optional(), ...Paging })
        .strict()
        .optional()
    )
    .handler(({ input, context }) => context.repo(ContactRepository).scanDuplicates(input)),

  create: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ data: ContactCreate }).strict())
    .handler(async ({ input, context }) => {
      const [created] = await context.repo(ContactRepository).create(input);
      return created ?? null;
    }),

  bulkCreate: mutation
    .input(z.object({ data: z.array(ContactCreate) }).strict())
    .handler(({ input, context }) => context.repo(ContactRepository).bulkCreate(input)),

  update: mutation
    .meta({ legacy: 'first' })
    .input(z.object({ id: Id, data: ContactPatch }).strict())
    .handler(async ({ input, context }) => {
      const [updated] = await context.repo(ContactRepository).update(input);
      return updated ?? null;
    }),

  softDelete: destructive
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) => {
      const [deleted] = await context.repo(ContactRepository).softDelete(input);
      return deleted ?? null;
    }),

  restore: mutation
    .meta({ legacy: 'first' })
    .input(ById)
    .handler(async ({ input, context }) => {
      const [restored] = await context.repo(ContactRepository).restore(input);
      return restored ?? null;
    }),

  delete: destructive
    .input(ById)
    .handler(({ input, context }) => context.repo(ContactRepository).delete(input)),

  merge: destructive
    .input(
      z
        .object({
          winnerId: Id,
          loserIds: z.array(Id).min(1),
          fields: z.record(z.string(), Id).optional(),
        })
        .strict()
    )
    .handler(({ input, context }) => context.repo(ContactRepository).merge(input)),
};

/** Para el cliente tipado: `actionsOf<ContactActions>('contacts')`. */
export type ContactActions = typeof contactActions;
