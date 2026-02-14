/**
 * @coongro/contacts — Módulo genérico y reutilizable de gestión de contactos
 */

export { contactTable } from './schema/contact.js';
export type { ContactRow, NewContactRow } from './schema/contact.js';
export { ContactRepository } from './repositories/contact.repository.js';
export type { SearchParams, CountByTypeResult } from './repositories/contact.repository.js';
