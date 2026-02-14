import { eq, and, or, ilike, isNull, sql } from 'drizzle-orm';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';

import { contactTable } from '../schema/contact.js';
import type { ContactRow, NewContactRow } from '../schema/contact.js';

export interface SearchParams {
  query?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface CountByTypeResult {
  type: string;
  count: number;
}

export class ContactRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  // ---------------------------------------------------------------------------
  // CRUD base
  // ---------------------------------------------------------------------------

  async list(): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx.select().from(contactTable).where(isNull(contactTable.deleted_at))
    );
  }

  async getById({ id }: { id: string }): Promise<ContactRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(contactTable).where(eq(contactTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewContactRow }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx.insert(contactTable).values(data).returning()
    );
  }

  async update({ id, data }: { id: string; data: Partial<NewContactRow> }): Promise<ContactRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(contactTable)
        .set(data)
        .where(eq(contactTable.id, id))
        .returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(contactTable).where(eq(contactTable.id, id))
    );
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

  async search({ query, type, tags, isActive, includeDeleted, limit, offset }: SearchParams): Promise<ContactRow[]> {
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
          )!
        );
      }

      if (type) {
        conditions.push(eq(contactTable.type, type));
      }

      if (isActive !== undefined) {
        conditions.push(eq(contactTable.is_active, isActive));
      }

      if (tags && tags.length > 0) {
        conditions.push(sql`${contactTable.tags} ?| array[${sql.join(tags.map((t) => sql`${t}`), sql`, `)}]`);
      }

      let q = tx.select().from(contactTable);

      if (conditions.length > 0) {
        q = q.where(and(...conditions)) as typeof q;
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

  async findByDocument({ documentType, documentNumber }: { documentType: string; documentNumber: string }): Promise<ContactRow | undefined> {
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
    return this.db.ormQuery((tx) =>
      tx.insert(contactTable).values(data).returning()
    );
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

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
}
