import type { ContactKind } from '../types/contact.js';

/** Valores de `type` que, en el vocabulario de algún kit, dicen persona u organización. */
const ORGANIZATION_TYPES = new Set([
  'company',
  'empresa',
  'organization',
  'organizacion',
  'organización',
]);
const PERSON_TYPES = new Set(['person', 'persona']);

/**
 * El `kind` que implica un `type`, con la misma regla que los backfills (0002 y 0003).
 * `undefined` si el `type` es un rol que no dice nada de eso (owner, tenant...).
 */
export function kindFromType(type: unknown): ContactKind | undefined {
  if (typeof type !== 'string') return undefined;
  const normalized = type.trim().toLowerCase();
  if (ORGANIZATION_TYPES.has(normalized)) return 'organization';
  if (PERSON_TYPES.has(normalized)) return 'person';
  return undefined;
}
