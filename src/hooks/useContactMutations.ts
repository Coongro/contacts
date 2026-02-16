/**
 * Hook para operaciones de mutación de contactos (crear, editar, eliminar).
 */
import { getHostReact, actions, usePlugin } from '@coongro/plugin-sdk';

import type { Contact, ContactCreateData, ContactUpdateData } from '../types/contact.js';

const React = getHostReact();
const { useState, useCallback } = React;

export interface UseContactMutationsResult {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: ContactCreateData) => Promise<Contact | null>;
  update: (id: string, data: ContactUpdateData) => Promise<Contact | null>;
  remove: (id: string) => Promise<boolean>;
  softDelete: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;
}

export function useContactMutations(): UseContactMutationsResult {
  const { toast } = usePlugin();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = useCallback(
    async (data: ContactCreateData): Promise<Contact | null> => {
      setCreating(true);
      try {
        const result = await actions.execute<Contact[]>('contacts.create', { data });
        toast.success('Contacto creado', data.name);
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo crear el contacto');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [toast]
  );

  const update = useCallback(
    async (id: string, data: ContactUpdateData): Promise<Contact | null> => {
      setUpdating(true);
      try {
        const result = await actions.execute<Contact[]>('contacts.update', { id, data });
        toast.success('Contacto actualizado', '');
        return result[0] ?? null;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo actualizar');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [toast]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('contacts.delete', { id });
        toast.success('Contacto eliminado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      try {
        await actions.execute('contacts.softDelete', { id });
        toast.success('Contacto archivado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo archivar');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [toast]
  );

  const restore = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await actions.execute('contacts.restore', { id });
        toast.success('Contacto restaurado', '');
        return true;
      } catch (err) {
        toast.error('Error', err instanceof Error ? err.message : 'No se pudo restaurar');
        return false;
      }
    },
    [toast]
  );

  return { creating, updating, deleting, create, update, remove, softDelete, restore };
}
