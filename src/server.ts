/**
 * Exportaciones server-only (drizzle-orm, repositories, schema tables).
 * NO importar desde el browser — usar '@coongro/contacts' (entry principal) para hooks/componentes.
 */

export { contactTable } from './schema/contact.js';
export type { ContactRow, NewContactRow } from './schema/contact.js';
export { ContactRepository } from './repositories/contact.repository.js';
export type { SearchParams, CountByTypeResult } from './repositories/contact.repository.js';
