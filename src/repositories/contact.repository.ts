import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import type { PluginContext } from '@coongro/plugin-sdk/server';
import { eq, and, or, ilike, isNull, sql, asc, desc, getTableColumns, type SQL } from 'drizzle-orm';

import { contactTable } from '../schema/contact.js';
import type { ContactRow, NewContactRow } from '../schema/contact.js';
import {
  DUPLICATE_THRESHOLD,
  findDuplicatesSql,
  scanDuplicatesSql,
  type DuplicateCandidate,
  type DuplicatePair,
} from '../services/duplicates.js';
import { assertMergeable, buildMergePatch, type FieldChoices } from '../services/merge.js';

/**
 * Lo que este repositorio usa del contexto del plugin (`PluginContext`). Otros plugins lo
 * construyen sin contexto para leer (`new ContactRepository(db)`); `merge` lo necesita.
 */
export type ContactRepositoryContext = Pick<PluginContext, 'events'>;

export interface MergeParams {
  winnerId: string;
  loserIds: string[];
  /** Por campo, el id del registro del que se toma el valor. */
  fields?: FieldChoices;
}

/** Evento de app que emite `merge` para que cada plugin reasigne sus referencias. */
export const CONTACT_MERGED_EVENT = 'contacts.contact.merged';

export interface SearchParams {
  query?: string;
  type?: string;
  kind?: string;
  organizationId?: string;
  tags?: string[];
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface CountParams {
  type?: string;
  kind?: string;
  includeDeleted?: boolean;
}

/** Fila de `execute<Row>()`: un `type` (no `interface`) para que cumpla `Record<string, unknown>`. */
export type CountByTypeResult = {
  type: string;
  count: number;
};

export class ContactRepository {
  constructor(
    private readonly db: ModuleDatabaseAPI,
    private readonly context?: ContactRepositoryContext
  ) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async getById({ id }: { id: string }): Promise<ContactRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(contactTable).where(eq(contactTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewContactRow }): Promise<ContactRow[]> {
    // El id lo pone la tabla (`defaultRandom`). Generarlo acá solo cubría a quien
    // entrara por este repositorio, y los kits que crean contactos por su cuenta
    // quedaban afuera. Si `data` trae un id, se respeta.
    return this.db.ormQuery((tx) => tx.insert(contactTable).values(data).returning());
  }

  async update({ id, data }: { id: string; data: Partial<NewContactRow> }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(contactTable).set(data).where(eq(contactTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) => tx.delete(contactTable).where(eq(contactTable.id, id)));
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  async softDelete({ id }: { id: string }): Promise<ContactRow[]> {
    const now = new Date().toISOString();
    return this.db.ormQuery((tx) =>
      tx
        .update(contactTable)
        .set({ deleted_at: now, updated_at: now } as Partial<ContactRow>)
        .where(eq(contactTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(contactTable)
        .set({ deleted_at: null, updated_at: new Date().toISOString() } as Partial<ContactRow>)
        .where(eq(contactTable.id, id))
        .returning()
    );
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search({
    query,
    type,
    kind,
    organizationId,
    tags,
    isActive,
    includeDeleted,
    limit,
    offset,
    orderBy: orderByField,
    orderDir = 'asc',
  }: SearchParams): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) => {
      const conditions = searchConditions({
        query,
        type,
        kind,
        organizationId,
        tags,
        isActive,
        includeDeleted,
      });

      let q = tx
        .select()
        .from(contactTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(searchOrder(orderByField, orderDir))
        .$dynamic();
      if (limit) q = q.limit(limit);
      if (offset) q = q.offset(offset);
      return q;
    });
  }

  /**
   * La página de `search` y cuántos cumplen los filtros, en UNA consulta:
   * `count(*) OVER()` se calcula antes del LIMIT. Solo si la página vino vacía
   * (un offset más allá del final) hace falta contar aparte.
   */
  async searchPage(params: SearchParams): Promise<{ items: ContactRow[]; total: number }> {
    const conditions = searchConditions(params);
    const rows = await this.db.ormQuery((tx) => {
      let q = tx
        .select({
          ...getTableColumns(contactTable),
          total: sql<number>`count(*) over()`.mapWith(Number),
        })
        .from(contactTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(searchOrder(params.orderBy, params.orderDir ?? 'asc'))
        .$dynamic();
      if (params.limit) q = q.limit(params.limit);
      if (params.offset) q = q.offset(params.offset);
      return q;
    });
    if (rows.length === 0) {
      return { items: [], total: params.offset ? await this.countSearch(params) : 0 };
    }
    const total = rows[0]?.total ?? 0;
    return { items: rows.map(({ total: _total, ...row }) => row), total };
  }

  /** Cuántos contactos cumplen los filtros de `search` (sin paginar). */
  async countSearch(params: SearchParams): Promise<number> {
    const conditions = searchConditions(params);
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(contactTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    );
    return rows[0]?.count ?? 0;
  }

  async findByDocument({
    documentType,
    documentNumber,
  }: {
    documentType: string;
    documentNumber: string;
  }): Promise<ContactRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(contactTable)
        .where(
          and(
            eq(contactTable.document_type, documentType),
            eq(contactTable.document_number, documentNumber),
            isNull(contactTable.deleted_at)
          )
        )
        .limit(1)
    );
    return rows[0];
  }

  async findByEmail({ email }: { email: string }): Promise<ContactRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select()
        .from(contactTable)
        .where(and(ilike(contactTable.email, email), isNull(contactTable.deleted_at)))
        .limit(1)
    );
    return rows[0];
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  async listTags(): Promise<string[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.execute<{ tag: string }>(sql`
        SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
        FROM ${contactTable}
        WHERE deleted_at IS NULL AND tags IS NOT NULL
        ORDER BY tag
      `)
    );
    return rows.map((r) => r.tag);
  }

  // ---------------------------------------------------------------------------
  // Bulk
  // ---------------------------------------------------------------------------

  async bulkCreate({ data }: { data: NewContactRow[] }): Promise<ContactRow[]> {
    if (data.length === 0) return [];
    return this.db.ormQuery((tx) => tx.insert(contactTable).values(data).returning());
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async count({ type, kind, includeDeleted }: CountParams = {}): Promise<number> {
    const rows = await this.db.ormQuery((tx) => {
      const conditions: SQL[] = [];
      if (!includeDeleted) conditions.push(isNull(contactTable.deleted_at));
      if (type) conditions.push(eq(contactTable.type, type));
      if (kind) conditions.push(eq(contactTable.kind, kind));
      return tx
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(contactTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    });
    return Number(rows[0]?.count ?? 0);
  }

  async countByType(): Promise<CountByTypeResult[]> {
    return this.db.ormQuery((tx) =>
      tx.execute<CountByTypeResult>(sql`
        SELECT type, COUNT(*)::int AS count
        FROM ${contactTable}
        WHERE deleted_at IS NULL
        GROUP BY type
        ORDER BY count DESC
      `)
    );
  }

  // ---------------------------------------------------------------------------
  // Duplicados y fusión
  // ---------------------------------------------------------------------------

  /**
   * Candidatos a duplicado de un contacto, con puntaje (0–100) y los motivos: mismo
   * email (también entre los adicionales), documento, teléfono, dominio del sitio o
   * nombre parecido (trigramas sin acentos). Solo del mismo tipo (persona u
   * organización) y sin borrados.
   */
  async findDuplicates({
    id,
    minScore = DUPLICATE_THRESHOLD,
    limit = 10,
  }: {
    id: string;
    minScore?: number;
    limit?: number;
  }): Promise<DuplicateCandidate[]> {
    return this.db.ormQuery((tx) =>
      tx.execute<DuplicateCandidate>(findDuplicatesSql(contactTable, id, minScore, limit))
    );
  }

  /**
   * Barrido paginado de pares duplicados de un tipo, para la vista «Duplicados».
   * Cada par sale una vez (`a.id < b.id`), del puntaje más alto al más bajo.
   */
  async scanDuplicates({
    kind = 'person',
    minScore = DUPLICATE_THRESHOLD,
    limit = 50,
    offset = 0,
  }: {
    kind?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<DuplicatePair[]> {
    return this.db.ormQuery((tx) =>
      tx.execute<DuplicatePair>(
        scanDuplicatesSql(contactTable, kind, minScore, Math.min(limit, 200), offset)
      )
    );
  }

  /**
   * Fusiona `loserIds` en `winnerId`. Por campo gana el ganador salvo que `fields`
   * elija otro registro; lo vacío se completa con el perdedor más reciente; emails,
   * teléfonos y etiquetas se unen. Los perdedores quedan borrados con
   * `merged_into_id`, las personas de una organización absorbida pasan a la que queda,
   * y se publica `contacts.contact.merged` para que los demás plugins reasignen lo
   * suyo (oportunidades, actividades, mails…). Todo en una transacción.
   */
  async merge({ winnerId, loserIds, fields }: MergeParams): Promise<ContactRow> {
    // Sin el evento, los plugins que referencian al perdedor no se enteran: mejor no fusionar.
    if (!this.context) {
      throw new Error('ContactRepository.merge necesita el contexto del plugin (events).');
    }
    const { events } = this.context;
    const ids = [...new Set(loserIds)];
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(contactTable)
        .where(
          sql`${contactTable.id} in (${sql.join(
            [winnerId, ...ids].map((v) => sql`${v}`),
            sql`, `
          )})`
        )
        .for('update');
      const winner = rows.find((row) => row.id === winnerId);
      const losers = rows.filter((row) => row.id !== winnerId && ids.includes(row.id));
      assertMergeable(winner, losers, ids);
      const survivor = winner as ContactRow;

      const patch = buildMergePatch(survivor, losers, fields);
      const now = new Date().toISOString();
      const [merged] = await tx
        .update(contactTable)
        .set({ ...patch, updated_at: now } as Partial<ContactRow>)
        .where(eq(contactTable.id, winnerId))
        .returning();

      await tx
        .update(contactTable)
        .set({ deleted_at: now, merged_into_id: winnerId, updated_at: now } as Partial<ContactRow>)
        .where(
          sql`${contactTable.id} in (${sql.join(
            ids.map((v) => sql`${v}`),
            sql`, `
          )})`
        );

      // Las personas de una organización absorbida siguen en la que queda.
      await tx
        .update(contactTable)
        .set({ organization_id: winnerId, updated_at: now } as Partial<ContactRow>)
        .where(
          sql`${contactTable.organization_id} in (${sql.join(
            ids.map((v) => sql`${v}`),
            sql`, `
          )})`
        );

      await events.publish(tx, {
        type: CONTACT_MERGED_EVENT,
        entityId: winnerId,
        payload: {
          winnerId,
          loserIds: ids,
          kind: survivor.kind,
          winnerName: merged?.name ?? survivor.name,
          loserNames: losers.map((row) => row.name),
        },
      });

      return merged ?? survivor;
    });
  }
}

/** Los filtros de `search`, compartidos con `countSearch`. */
function searchConditions({
  query,
  type,
  kind,
  organizationId,
  tags,
  isActive,
  includeDeleted,
}: SearchParams): SQL[] {
  const conditions: SQL[] = [];

  if (!includeDeleted) {
    conditions.push(isNull(contactTable.deleted_at));
  }

  if (query) {
    const pattern = `%${query}%`;
    const matches = or(
      ilike(contactTable.name, pattern),
      ilike(contactTable.email, pattern),
      ilike(contactTable.phone, pattern),
      ilike(contactTable.document_number, pattern)
    );
    if (matches) conditions.push(matches);
  }

  if (type) {
    conditions.push(eq(contactTable.type, type));
  }

  if (kind) {
    conditions.push(eq(contactTable.kind, kind));
  }

  if (organizationId) {
    conditions.push(eq(contactTable.organization_id, organizationId));
  }

  if (isActive !== undefined) {
    conditions.push(eq(contactTable.is_active, isActive));
  }

  if (tags && tags.length > 0) {
    conditions.push(
      sql`${contactTable.tags} ?| array[${sql.join(
        tags.map((t) => sql`${t}`),
        sql`, `
      )}]`
    );
  }

  return conditions;
}

/** Columnas por las que se ordena `search`; sin una conocida, lo más nuevo primero. */
const SORTABLE = {
  name: contactTable.name,
  type: contactTable.type,
  kind: contactTable.kind,
  phone: contactTable.phone,
  email: contactTable.email,
  is_active: contactTable.is_active,
  created_at: contactTable.created_at,
} as const;

function searchOrder(orderBy: string | undefined, orderDir: 'asc' | 'desc'): SQL {
  const column = orderBy ? SORTABLE[orderBy as keyof typeof SORTABLE] : undefined;
  if (!column) return desc(contactTable.created_at);
  return orderDir === 'desc' ? desc(column) : asc(column);
}
