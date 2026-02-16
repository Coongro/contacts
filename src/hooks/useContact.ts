/**
 * Hook para obtener un contacto individual por ID.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

import type { Contact } from '../types/contact.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface UseContactResult {
  contact: Contact | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContact(id: string | null | undefined): UseContactResult {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!id) {
      setContact(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await actions.execute<Contact | undefined>('contacts.getById', { id });
      if (!mountedRef.current) return;
      setContact(result ?? null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar contacto');
      setContact(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { contact, loading, error, refetch: fetch };
}
