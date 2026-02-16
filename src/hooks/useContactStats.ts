/**
 * Hook para obtener estadísticas de contactos.
 */
import { getHostReact, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export interface ContactStatsData {
  total: number;
  byType: Array<{ type: string; count: number }>;
  active: number;
  inactive: number;
}

export function useContactStats(): {
  stats: ContactStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [stats, setStats] = useState<ContactStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const byType =
        await actions.execute<Array<{ type: string; count: number }>>('contacts.countByType');

      if (!mountedRef.current) return;

      const total = byType.reduce((sum, item) => sum + item.count, 0);

      setStats({
        total,
        byType,
        active: total,
        inactive: 0,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
