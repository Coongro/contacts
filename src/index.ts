/**
 * @coongro/contacts — Módulo genérico y reutilizable de gestión de contactos
 *
 * Exporta:
 * - Schema y tipos de la base de datos
 * - Repository para operaciones CRUD
 * - Hooks React para datos (useContacts, useContact, useContactMutations, useContactStats)
 * - Componentes React reutilizables (ContactsTable, ContactForm, ContactPicker, etc.)
 * - Tipos de props para extensión por bloques
 */

// Schema + Repository → exportados via subpath '@coongro/contacts/server'
// NO exportar aquí: contienen imports de drizzle-orm que no corren en el browser
export type { ContactRow, NewContactRow } from './schema/contact.js';
export type { SearchParams, CountByTypeResult } from './repositories/contact.repository.js';

// Types
export type {
  Contact,
  ContactType,
  ContactCreateData,
  ContactUpdateData,
} from './types/contact.js';
export type { ContactFilters } from './types/filters.js';
export type {
  ColumnDef,
  ActionDef,
  FilterDef,
  FieldDef,
  SectionDef,
  StatDef,
  ContactsTableProps,
  ContactFormProps,
  ContactPickerProps,
  ContactCardProps,
  ContactStatsProps,
  ContactDetailProps,
  CreateContactButtonProps,
} from './types/components.js';

// Hooks
export { useContacts } from './hooks/useContacts.js';
export type { UseContactsOptions, UseContactsResult } from './hooks/useContacts.js';
export { useContact } from './hooks/useContact.js';
export type { UseContactResult } from './hooks/useContact.js';
export { useContactMutations } from './hooks/useContactMutations.js';
export type { UseContactMutationsResult } from './hooks/useContactMutations.js';
export { useContactStats } from './hooks/useContactStats.js';
export type { ContactStatsData } from './hooks/useContactStats.js';

// Components
export { ContactsTable } from './components/ContactsTable.js';
export { ContactForm } from './components/ContactForm.js';
export { ContactPicker } from './components/ContactPicker.js';
export { ContactCard } from './components/ContactCard.js';
export { ContactStats } from './components/ContactStats.js';
export { ContactDetail } from './components/ContactDetail.js';
export { CreateContactButton } from './components/CreateContactButton.js';
