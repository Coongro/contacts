/**
 * Tarjetas de estadísticas de contactos para dashboards.
 * Usa StatCard + DynamicIcon de la librería UI compartida.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContactStats } from '../hooks/useContactStats.js';
import type { ContactStatsProps, StatDef } from '../types/components.js';

const React = getHostReact();
const UI = getHostUI();

/** Mapeo de icon key a nombre de icono Lucide */
const ICON_MAP: Record<string, string> = {
  users: 'Users',
  person: 'User',
  company: 'Building2',
  active: 'CheckCircle',
};

export function ContactStats(props: ContactStatsProps) {
  const { layout = 'row', extraStats = [], className = '' } = props;

  const { stats, loading, error } = useContactStats();

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: 'Error al cargar estadísticas',
    });
  }

  // Construir stats cards
  const cards: StatDef[] = [];

  if (stats) {
    cards.push({
      label: 'Total',
      value: stats.total,
      icon: 'users',
      footer: 'Contactos registrados',
    });

    const personCount = stats.byType.find((t) => t.type === 'person')?.count ?? 0;
    const companyCount = stats.byType.find((t) => t.type === 'company')?.count ?? 0;

    if (personCount > 0) {
      cards.push({
        label: 'Personas',
        value: personCount,
        icon: 'person',
      });
    }

    if (companyCount > 0) {
      cards.push({
        label: 'Empresas',
        value: companyCount,
        icon: 'company',
      });
    }
  }

  // Agregar stats extra del bloque
  cards.push(...extraStats);

  const gridClass = layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex gap-4 overflow-x-auto';

  return React.createElement(
    'div',
    { className: `${gridClass} ${className}` },
    loading
      ? Array.from({ length: 3 }).map((_, i) =>
          React.createElement(UI.Skeleton, {
            key: i,
            className: 'flex-1 min-w-[280px] h-[236px] rounded-2xl',
          })
        )
      : cards.map((card, i) =>
          React.createElement(UI.StatCard, {
            key: i,
            label: card.label,
            value: card.value,
            className: 'flex-1 min-w-[280px]',
            icon: React.createElement(UI.DynamicIcon, {
              icon: ICON_MAP[card.icon ?? 'users'] ?? 'Users',
              size: 28,
            }),
            footer: card.footer ?? undefined,
          })
        )
  );
}
