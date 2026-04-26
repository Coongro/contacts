/**
 * Props para todos los componentes reutilizables de contacts.
 */
import type * as React from 'react';

import type { Contact, ContactCreateData } from './contact.js';
import type { ContactFilters } from './filters.js';

// ---------------------------------------------------------------------------
// Tipos compartidos para extensión
// ---------------------------------------------------------------------------

export interface ColumnDef<T = Contact> {
  key: string;
  header: string;
  render?: (item: T) => unknown;
  className?: string;
}

export interface ActionDef<T = Contact> {
  label: string;
  icon?: string;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive';
  hidden?: (item: T) => boolean;
}

export interface FilterDef {
  key: string;
  label: string;
  type: 'boolean' | 'select' | 'text';
  options?: Array<{ label: string; value: string }>;
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'toggle';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface SectionDef {
  title: string;
  render: () => unknown;
  order?: number;
}

export interface StatDef {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  footer?: string;
}

// ---------------------------------------------------------------------------
// ContactsTable
// ---------------------------------------------------------------------------

export interface ContactsTableProps {
  filters?: ContactFilters;
  columns?: ColumnDef[];
  extraColumns?: ColumnDef[];
  extraActions?: ActionDef[];
  extraFilters?: FilterDef[];
  onRowClick?: (contact: Contact) => void;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  emptyIcon?: string;
}

// ---------------------------------------------------------------------------
// ContactForm
// ---------------------------------------------------------------------------

export interface ContactFormProps {
  contactId?: string;
  defaults?: Partial<ContactCreateData>;
  extraFields?: FieldDef[];
  /** Keys de campos base a ocultar (ej: ['type'] para no mostrar selector de tipo) */
  hiddenFields?: string[];
  onSuccess?: (contact: Contact) => void;
  onCancel?: () => void;
  onExtraFieldsData?: (data: Record<string, unknown>) => void;
  className?: string;
  /** Ref al elemento <form>. El caller puede disparar submit con `formRef.current?.requestSubmit()` */
  formRef?: React.Ref<HTMLFormElement>;
  /** Si es true, el form no renderiza sus propios botones (los pone el caller en el footer del dialog) */
  hideActions?: boolean;
  /** Notifica al caller cuando cambia el estado de guardado */
  onSavingChange?: (saving: boolean) => void;
}

// ---------------------------------------------------------------------------
// ContactPicker
// ---------------------------------------------------------------------------

export interface ContactPickerProps {
  filters?: ContactFilters;
  value?: string | null;
  onChange?: (contact: Contact | null) => void;
  placeholder?: string;
  allowCreate?: boolean;
  /** Callback al hacer clic en "+ Crear". Recibe el texto de búsqueda actual. */
  onCreateClick?: (query: string) => void;
  createDefaults?: Partial<ContactCreateData>;
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// ContactCard
// ---------------------------------------------------------------------------

export interface ContactCardProps {
  contactId?: string;
  contact?: Contact;
  showFields?: Array<keyof Contact>;
  extraInfo?: unknown;
  actions?: ActionDef[];
  onClick?: (contact: Contact) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// ContactStats
// ---------------------------------------------------------------------------

export interface ContactStatsProps {
  filters?: ContactFilters;
  layout?: 'row' | 'grid';
  extraStats?: StatDef[];
  className?: string;
}

// ---------------------------------------------------------------------------
// ContactDetail
// ---------------------------------------------------------------------------

export interface ContactDetailProps {
  contactId: string;
  extraSections?: SectionDef[];
  extraActions?: ActionDef[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// CreateContactButton
// ---------------------------------------------------------------------------

export interface CreateContactButtonProps {
  defaults?: Partial<ContactCreateData>;
  label?: string;
  extraFields?: FieldDef[];
  onSuccess?: (contact: Contact) => void;
  variant?: 'primary' | 'outline';
  className?: string;
}
