/**
 * Reglas de fusión de contactos, sin base de datos (se prueban solas).
 *
 * Twenty elige un registro prioritario y deja que el usuario cambie campo por campo;
 * Mautic se queda con el valor del contacto modificado más recientemente y une lo
 * múltiple. Acá: gana el prioritario salvo que el usuario elija otro registro para ese
 * campo; si el prioritario lo tiene vacío, se completa con el del más reciente que lo
 * tenga; emails, teléfonos y etiquetas se unen.
 */

import type { ContactRow } from '../schema/contact.js';

/** Campos simples que se eligen de un solo registro. */
export const MERGEABLE_FIELDS = [
  'name',
  'first_name',
  'last_name',
  'job_title',
  'organization_id',
  'phone',
  'email',
  'website',
  'linkedin',
  'document_type',
  'document_number',
  'address',
  'address_street',
  'address_city',
  'address_state',
  'address_postcode',
  'address_country',
  'owner_staff_id',
  'notes',
  'avatar_url',
] as const;

export type MergeableField = (typeof MERGEABLE_FIELDS)[number];

/** Por campo, el id del registro del que se toma el valor. */
export type FieldChoices = Partial<Record<MergeableField, string>>;

export type MergePatch = Partial<
  Pick<ContactRow, MergeableField | 'additional_emails' | 'additional_phones' | 'tags' | 'metadata'>
>;

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim());
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/** Une valores sin repetir, comparando con `key`; se descarta lo que ya es el principal. */
function union(values: string[], primary: string | null | undefined, key: (v: string) => string) {
  const seen = new Set<string>(primary && !isEmpty(primary) ? [key(primary)] : []);
  const out: string[] = [];
  for (const value of values) {
    const k = key(value);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(value.trim());
  }
  return out;
}

export const emailKey = (v: string): string => v.trim().toLowerCase();
export const phoneKey = (v: string): string => v.replace(/[^0-9]/g, '');

/**
 * Lo que hay que escribir en el ganador. `losers` puede venir en cualquier orden: el
 * relleno de vacíos toma el más reciente por `updated_at`.
 */
export function buildMergePatch(
  winner: ContactRow,
  losers: ContactRow[],
  choices: FieldChoices = {}
): MergePatch {
  const all = [winner, ...losers];
  const byId = new Map(all.map((row) => [row.id, row]));
  const byRecency = [...losers].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const patch: MergePatch = {};

  for (const field of MERGEABLE_FIELDS) {
    const chosenId = choices[field];
    let value: unknown;
    if (chosenId) {
      const source = byId.get(chosenId);
      if (!source) throw new Error(`El registro elegido para «${field}» no es parte de la fusión.`);
      value = source[field];
    } else if (!isEmpty(winner[field])) {
      continue;
    } else {
      value = byRecency.find((row) => !isEmpty(row[field]))?.[field];
    }
    if (value !== undefined && value !== winner[field]) {
      (patch as Record<string, unknown>)[field] = value;
    }
  }

  const finalEmail = (patch.email !== undefined ? patch.email : winner.email) ?? null;
  const finalPhone = (patch.phone !== undefined ? patch.phone : winner.phone) ?? null;

  const emails = union(
    all.flatMap((row) => [
      ...(row.email ? [row.email] : []),
      ...asStringList(row.additional_emails),
    ]),
    finalEmail,
    emailKey
  );
  const phones = union(
    all.flatMap((row) => [
      ...(row.phone ? [row.phone] : []),
      ...asStringList(row.additional_phones),
    ]),
    finalPhone,
    phoneKey
  );
  patch.additional_emails = emails;
  patch.additional_phones = phones;

  const tags = union(
    all.flatMap((row) => asStringList(row.tags)),
    null,
    (v) => v.trim().toLowerCase()
  );
  if (tags.length > 0 || winner.tags !== null) patch.tags = tags;

  // Metadata: la del ganador pisa a la de los perdedores, clave por clave.
  const metadata = Object.assign(
    {},
    ...[...byRecency].reverse().map((row) => (row.metadata as Record<string, unknown>) ?? {}),
    (winner.metadata as Record<string, unknown>) ?? {}
  ) as Record<string, unknown>;
  if (Object.keys(metadata).length > 0) patch.metadata = metadata;

  return patch;
}

/** Validaciones previas a fusionar (fuera de la base para poder probarlas). */
export function assertMergeable(
  winner: ContactRow | undefined,
  losers: ContactRow[],
  loserIds: string[]
) {
  if (!winner) throw new Error('No encontré el registro que queda.');
  if (winner.deleted_at) throw new Error('El registro que queda está borrado.');
  if (loserIds.length === 0) throw new Error('Elegí al menos un registro para fusionar.');
  if (loserIds.includes(winner.id))
    throw new Error('El registro que queda no puede fusionarse consigo mismo.');
  if (losers.length !== new Set(loserIds).size)
    throw new Error('Alguno de los registros a fusionar no existe.');
  for (const loser of losers) {
    if (loser.kind !== winner.kind) {
      throw new Error('No se puede fusionar una persona con una organización.');
    }
    if (loser.merged_into_id)
      throw new Error(`«${loser.name}» ya fue fusionado con otro registro.`);
  }
}
