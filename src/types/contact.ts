/**
 * Tipos de contacto para uso en componentes y hooks.
 * Espejo de ContactRow del schema, con tipos explícitos para jsonb.
 */

export interface Contact {
  id: string;
  // Los campos opcionales llegaron con la ampliación persona/organización. La base
  // siempre los devuelve; son opcionales para no romper a quien arma un Contact a mano.
  type: string;
  kind?: ContactKind;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  organization_id?: string | null;
  phone: string | null;
  email: string | null;
  additional_phones?: string[];
  additional_emails?: string[];
  website?: string | null;
  linkedin?: string | null;
  document_type: string | null;
  document_number: string | null;
  address: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postcode?: string | null;
  address_country?: string | null;
  owner_staff_id?: string | null;
  notes: string | null;
  avatar_url: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactType = 'person' | 'company' | 'other';

/** Persona u organización. Independiente de `type`, que es el rol de cada kit. */
export type ContactKind = 'person' | 'organization';

export interface ContactCreateData {
  id?: string;
  type: string;
  kind?: ContactKind;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  organization_id?: string | null;
  phone?: string | null;
  email?: string | null;
  additional_phones?: string[];
  additional_emails?: string[];
  website?: string | null;
  linkedin?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  address?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postcode?: string | null;
  address_country?: string | null;
  owner_staff_id?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  is_active?: boolean;
}

export type ContactUpdateData = Partial<ContactCreateData>;
