import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq, and, or, ilike, isNull, sql, asc, desc, type SQL } from 'drizzle-orm';

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
 * Lo que este repositorio usa del segundo argumento del constructor
 * (`RepositoryContext` del Core). Estructural para no atar el plugin a una versión
 * del SDK: sin `events`, la fusión igual se hace, pero nadie se entera.
 */
export interface ContactRepositoryContext {
  events?: {
    publish(
      tx: unknown,
      event: { type: string; entityId?: string | null; payload?: Record<string, unknown> }
    ): Promise<void>;
  };
}

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

export interface ListParams {
  limit?: number;
  offset?: number;
}

export interface CountParams {
  type?: string;
  kind?: string;
  includeDeleted?: boolean;
}

export interface CountByTypeResult {
  type: string;
  count: number;
}

export class ContactRepository {
  constructor(
    private readonly db: ModuleDatabaseAPI,
    private readonly context?: ContactRepositoryContext
  ) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  /**
   * Sin paginación por defecto: billing, maintenance, leases y otros kits esperan la
   * agenda completa. `limit`/`offset` solo aplican si se pasan.
   */
  async list({ limit, offset }: ListParams = {}): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) => {
      let q = tx.select().from(contactTable).where(isNull(contactTable.deleted_at));
      if (limit || offset) {
        q = q.orderBy(desc(contactTable.created_at), asc(contactTable.id)) as typeof q;
      }
      if (limit) {
        q = q.limit(limit) as typeof q;
      }
      if (offset) {
        q = q.offset(offset) as typeof q;
      }
      return q;
    });
  }

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
      const conditions = [];

      if (!includeDeleted) {
        conditions.push(isNull(contactTable.deleted_at));
      }

      if (query) {
        const pattern = `%${query}%`;
        conditions.push(
          or(
            ilike(contactTable.name, pattern),
            ilike(contactTable.email, pattern),
            ilike(contactTable.phone, pattern),
            ilike(contactTable.document_number, pattern)
          )
        );
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

      let q = tx.select().from(contactTable);

      if (conditions.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        q = q.where(and(...conditions)) as typeof q;
      }

      // Ordenamiento
      const sortableColumns: Record<string, () => typeof q> = {
        name: () => q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.name)) as typeof q,
        type: () => q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.type)) as typeof q,
        kind: () => q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.kind)) as typeof q,
        phone: () => q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.phone)) as typeof q,
        email: () => q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.email)) as typeof q,
        is_active: () =>
          q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.is_active)) as typeof q,
        created_at: () =>
          q.orderBy((orderDir === 'desc' ? desc : asc)(contactTable.created_at)) as typeof q,
      };

      const applySorting = orderByField ? sortableColumns[orderByField] : undefined;
      if (applySorting) {
        q = applySorting();
      } else {
        q = q.orderBy(desc(contactTable.created_at)) as typeof q;
      }

      if (limit) {
        q = q.limit(limit) as typeof q;
      }

      if (offset) {
        q = q.offset(offset) as typeof q;
      }

      return q;
    });
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
  // Organizaciones
  // ---------------------------------------------------------------------------

  /** Las personas (o lo que sea) que pertenecen a una organización. */
  async listByOrganization({ organizationId }: { organizationId: string }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(contactTable)
        .where(
          and(eq(contactTable.organization_id, organizationId), isNull(contactTable.deleted_at))
        )
        .orderBy(asc(contactTable.name))
    );
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  async listTags(): Promise<string[]> {
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(sql`
        SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
        FROM ${contactTable}
        WHERE deleted_at IS NULL AND tags IS NOT NULL
        ORDER BY tag
      `)
    );
    return (rows as unknown as Array<{ tag: string }>).map((r) => r.tag);
  }

  async findByTag({ tag }: { tag: string }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(contactTable)
        .where(and(sql`${contactTable.tags} ? ${tag}`, isNull(contactTable.deleted_at)))
    );
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
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(sql`
        SELECT type, COUNT(*)::int AS count
        FROM ${contactTable}
        WHERE deleted_at IS NULL
        GROUP BY type
        ORDER BY count DESC
      `)
    );
    return rows as unknown as CountByTypeResult[];
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
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(findDuplicatesSql(contactTable, id, minScore, limit))
    );
    return rows as unknown as DuplicateCandidate[];
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
    const rows = await this.db.ormQuery((tx) =>
      tx.execute(scanDuplicatesSql(contactTable, kind, minScore, Math.min(limit, 200), offset))
    );
    return rows as unknown as DuplicatePair[];
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

      await this.context?.events?.publish(tx, {
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
