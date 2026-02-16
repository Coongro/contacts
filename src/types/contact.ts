/**
 * Tipos de contacto para uso en componentes y hooks.
 * Espejo de ContactRow del schema, con tipos explícitos para jsonb.
 */

export interface Contact {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
  document_type: string | null;
  document_number: string | null;
  address: string | null;
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

export interface ContactCreateData {
  id?: string;
  type: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  address?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  is_active?: boolean;
}

export type ContactUpdateData = Partial<ContactCreateData>;
