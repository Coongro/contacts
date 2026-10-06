/**
 * Acciones de contacts: el contrato que el Core valida y expone.
 *
 * Cada acción declara qué acepta (lo que no está, se rechaza: nadie escribe
 * `created_at` ni `deleted_at` desde afuera) y delega en el repositorio.
 *
 * Forma de las respuestas: un registro es un objeto (o `null`), las listas que
 * crecen con la agenda son páginas (`pageInput` → `{ items, total }`) y las
 * demás, un array.
 */

import {
  createInsertSchema,
  listPage,
  mutation,
  pageInput,
  query,
  z,
  type Page,
} from '@coongro/plugin-sdk/actions';
import { eq, sql } from 'drizzle-orm';

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

/** Columnas por las que se ordenan las listas (las mismas que `search` en el repositorio). */
const SORTABLE = ['name', 'type', 'kind', 'phone', 'email', 'is_active', 'created_at'] as const;
/** Columnas de texto donde busca el `search` de una lista. */
const SEARCHABLE = ['name', 'email', 'phone', 'document_number'] as const;

/** Una página con los filtros de siempre: `query` sigue siendo el texto a buscar (o `search`). */
const SearchInput = pageInput(
  {
    query: z.string().optional(),
    type: z.string().optional(),
    kind: z.string().optional(),
    organizationId: Id.optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    includeDeleted: z.boolean().optional(),
  },
  { orderBy: [...SORTABLE] }
);

const destructive = mutation.meta({ effect: 'destructive' });

export const contactActions = {
  list: query
    .meta({ page: true })
    .input(
      pageInput(
        {
          type: z.string().optional(),
          kind: z.string().optional(),
          organization_id: Id.optional(),
          is_active: z.boolean().optional(),
        },
        { orderBy: [...SORTABLE] }
      )
    )
    .handler(
      ({ input, context }): Promise<Page<ContactRow>> =>
        listPage(context.db, contactTable, input, {
          search: [...SEARCHABLE],
          orderBy: [...SORTABLE],
          filters: ['type', 'kind', 'organization_id', 'is_active'],
          defaultOrder: { by: 'created_at', dir: 'desc' },
        })
    ),

  search: query
    .meta({ page: true })
    .input(SearchInput)
    .handler(({ input, context }): Promise<Page<ContactRow>> => {
      const { search, query: text, ...filters } = input;
      return context.repo(ContactRepository).searchPage({ ...filters, query: text ?? search });
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
    .meta({ page: true })
    .input(pageInput({ tag: z.string().min(1) }, { orderBy: [...SORTABLE] }))
    .handler(
      ({ input, context }): Promise<Page<ContactRow>> =>
        listPage(context.db, contactTable, input, {
          search: [...SEARCHABLE],
          orderBy: [...SORTABLE],
          defaultOrder: { by: 'name', dir: 'asc' },
          where: sql`${contactTable.tags} ? ${input.tag}`,
        })
    ),

  listTags: query.handler(({ context }) => context.repo(ContactRepository).listTags()),

  listByOrganization: query
    .meta({ page: true })
    .input(pageInput({ organizationId: Id }, { orderBy: [...SORTABLE] }))
    .handler(
      ({ input, context }): Promise<Page<ContactRow>> =>
        listPage(context.db, contactTable, input, {
          search: [...SEARCHABLE],
          orderBy: [...SORTABLE],
          defaultOrder: { by: 'name', dir: 'asc' },
          where: eq(contactTable.organization_id, input.organizationId),
        })
    ),

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
    .input(z.object({ data: ContactCreate }).strict())
    .handler(async ({ input, context }) => {
      const [created] = await context.repo(ContactRepository).create(input);
      return created ?? null;
    }),

  bulkCreate: mutation
    .input(z.object({ data: z.array(ContactCreate) }).strict())
    .handler(({ input, context }) => context.repo(ContactRepository).bulkCreate(input)),

  update: mutation
    .input(z.object({ id: Id, data: ContactPatch }).strict())
    .handler(async ({ input, context }) => {
      const [updated] = await context.repo(ContactRepository).update(input);
      return updated ?? null;
    }),

  softDelete: destructive.input(ById).handler(async ({ input, context }) => {
    const [deleted] = await context.repo(ContactRepository).softDelete(input);
    return deleted ?? null;
  }),

  restore: mutation.input(ById).handler(async ({ input, context }) => {
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
