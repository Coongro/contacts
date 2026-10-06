/**
 * Detección de duplicados de contactos.
 *
 * Motivos y peso (se suman, con tope 100):
 * - `email`: mismo email principal (o uno de los adicionales, en `findDuplicates`): 100.
 * - `document`: mismo número de documento: 100.
 * - `domain`: mismo dominio del sitio web (organizaciones): 90.
 * - `phone`: mismos últimos 8 dígitos del teléfono: 80. Ocho dígitos alcanzan para
 *   igualar «+54 9 358 412-3456» con «0358 15 412 3456» sin comparar prefijos.
 * - `name`: nombre parecido, similitud de trigramas sin acentos ≥ 0,6: hasta 70. Solo
 *   con el nombre, un par aparece si es casi idéntico (≥ 0,86): el nombre refuerza, no
 *   alcanza solo.
 *
 * Usa `pg_trgm` y `f_unaccent` (migración 0004). En Coongro Local los carga la edición.
 */

import { sql, type SQL } from 'drizzle-orm';

import type { contactTable } from '../schema/contact.js';

/** Puntaje mínimo para mostrar un candidato. */
export const DUPLICATE_THRESHOLD = 60;

export type DuplicateReason = 'email' | 'document' | 'domain' | 'phone' | 'name';

// `type` y no `interface`: son filas de `execute<Row>()`, que pide `Record<string, unknown>`.
export type DuplicateCandidate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  kind: string;
  updated_at: string;
  score: number;
  reasons: DuplicateReason[];
};

export type DuplicatePair = {
  a_id: string;
  a_name: string;
  a_email: string | null;
  a_phone: string | null;
  b_id: string;
  b_name: string;
  b_email: string | null;
  b_phone: string | null;
  score: number;
  reasons: DuplicateReason[];
};

/** Dominio de un sitio web en SQL: sin protocolo, sin `www.` ni ruta. */
const domainOf = (column: SQL | string): SQL =>
  sql`nullif(lower(regexp_replace(coalesce(${typeof column === 'string' ? sql.raw(column) : column}, ''), '^([a-z]+://)?(www\\.)?([^/?#]+).*$', '\\3', 'i')), '')`;

const normName = (alias: string): SQL => sql.raw(`lower(f_unaccent(${alias}.name))`);

/** Filas vivas de un tipo, con las columnas que usan las reglas. */
function baseCte(table: typeof contactTable, kindFilter: SQL): SQL {
  return sql`
    select id, name, email, phone, kind, updated_at, document_number, website,
           phone_normalized, additional_emails
    from ${table}
    where deleted_at is null and merged_into_id is null and ${kindFilter}
  `;
}

/** Candidatos de un contacto puntual. */
export function findDuplicatesSql(
  table: typeof contactTable,
  id: string,
  minScore: number,
  limit: number
): SQL {
  return sql`
    with me as (
      select id, name, email, kind, document_number, website, phone_normalized
      from ${table} where id = ${id}
    ),
    base as (${baseCte(table, sql`kind = (select kind from me) and id <> ${id}`)}),
    hits as (
      select b.id, 'email' as reason, 100 as score from base b, me
      where me.email is not null and me.email <> '' and (
        lower(b.email) = lower(me.email)
        or b.additional_emails @> to_jsonb(array[me.email])
      )
      union all
      select b.id, 'document', 100 from base b, me
      where me.document_number is not null and me.document_number <> ''
        and b.document_number = me.document_number
      union all
      select b.id, 'domain', 90 from base b, me
      where ${domainOf(sql`me.website`)} is not null
        and ${domainOf(sql`b.website`)} = ${domainOf(sql`me.website`)}
      union all
      select b.id, 'phone', 80 from base b, me
      where length(me.phone_normalized) >= 8
        and right(b.phone_normalized, 8) = right(me.phone_normalized, 8)
      union all
      select b.id, 'name', round(similarity(${normName('b')}, ${normName('me')}) * 70)::int
      from base b, me
      where ${normName('b')} % ${normName('me')}
        and similarity(${normName('b')}, ${normName('me')}) >= 0.6
    )
    select b.id, b.name, b.email, b.phone, b.kind, b.updated_at,
           least(100, sum(h.score))::int as score,
           array_agg(distinct h.reason) as reasons
    from hits h join base b on b.id = h.id
    group by b.id, b.name, b.email, b.phone, b.kind, b.updated_at
    having sum(h.score) >= ${minScore}
    order by score desc, b.updated_at desc
    limit ${limit}
  `;
}

/** Todos los pares duplicados de un tipo, paginados. */
export function scanDuplicatesSql(
  table: typeof contactTable,
  kind: string,
  minScore: number,
  limit: number,
  offset: number
): SQL {
  return sql`
    with base as (${baseCte(table, sql`kind = ${kind}`)}),
    hits as (
      select a.id as a_id, b.id as b_id, 'email' as reason, 100 as score
      from base a join base b on a.id < b.id and lower(a.email) = lower(b.email)
      where a.email is not null and a.email <> ''
      union all
      select a.id, b.id, 'document', 100
      from base a join base b on a.id < b.id and a.document_number = b.document_number
      where a.document_number is not null and a.document_number <> ''
      union all
      select a.id, b.id, 'domain', 90
      from base a join base b on a.id < b.id
        and ${domainOf(sql`a.website`)} = ${domainOf(sql`b.website`)}
      where ${domainOf(sql`a.website`)} is not null
      union all
      select a.id, b.id, 'phone', 80
      from base a join base b on a.id < b.id
        and right(a.phone_normalized, 8) = right(b.phone_normalized, 8)
      where length(a.phone_normalized) >= 8
      union all
      select a.id, b.id, 'name', round(similarity(${normName('a')}, ${normName('b')}) * 70)::int
      from base a join base b on a.id < b.id and ${normName('a')} % ${normName('b')}
      where similarity(${normName('a')}, ${normName('b')}) >= 0.6
    ),
    pairs as (
      select a_id, b_id, least(100, sum(score))::int as score,
             array_agg(distinct reason) as reasons
      from hits group by a_id, b_id
      having sum(score) >= ${minScore}
    )
    select p.a_id, a.name as a_name, a.email as a_email, a.phone as a_phone,
           p.b_id, b.name as b_name, b.email as b_email, b.phone as b_phone,
           p.score, p.reasons
    from pairs p join base a on a.id = p.a_id join base b on b.id = p.b_id
    order by p.score desc, a.name asc
    limit ${limit} offset ${offset}
  `;
}
