/**
 * Tarjetas de estadísticas de contactos para dashboards.
 * Sigue el diseño StatCard con color de fondo + icono + valor.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useContactStats } from '../hooks/useContactStats.js';
import type { ContactStatsProps, StatDef } from '../types/components.js';

const React = getHostReact();

// Iconos SVG inline para las stats por defecto
const ICONS = {
  users: React.createElement(
    'svg',
    {
      width: 28,
      height: 28,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 2,
    },
    React.createElement('path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: 9, cy: 7, r: 4 }),
    React.createElement('path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }),
    React.createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
  ),
  person: React.createElement(
    'svg',
    {
      width: 28,
      height: 28,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 2,
    },
    React.createElement('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: 12, cy: 7, r: 4 })
  ),
  company: React.createElement(
    'svg',
    {
      width: 28,
      height: 28,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 2,
    },
    React.createElement('rect', { x: 2, y: 7, width: 20, height: 14, rx: 2 }),
    React.createElement('path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' })
  ),
  active: React.createElement(
    'svg',
    {
      width: 28,
      height: 28,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 2,
    },
    React.createElement('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
    React.createElement('polyline', { points: '22 4 12 14.01 9 11.01' })
  ),
};

const DEFAULT_COLORS = {
  total: '#DEEBE7',
  person: '#DEE5EB',
  company: '#EBE5DE',
  active: '#DEEBE7',
};

export function ContactStats(props: ContactStatsProps) {
  const { layout = 'row', extraStats = [], className = '' } = props;

  const { stats, loading, error } = useContactStats();

  if (error) {
    return React.createElement(
      'div',
      { className: 'text-sm text-[var(--cg-danger)] text-center py-4' },
      'Error al cargar estadísticas'
    );
  }

  // Construir stats cards
  const cards: StatDef[] = [];

  if (stats) {
    cards.push({
      label: 'Total',
      value: stats.total,
      icon: 'users',
      color: DEFAULT_COLORS.total,
      footer: 'Contactos registrados',
    });

    const personCount = stats.byType.find((t) => t.type === 'person')?.count ?? 0;
    const companyCount = stats.byType.find((t) => t.type === 'company')?.count ?? 0;

    if (personCount > 0) {
      cards.push({
        label: 'Personas',
        value: personCount,
        icon: 'person',
        color: DEFAULT_COLORS.person,
      });
    }

    if (companyCount > 0) {
      cards.push({
        label: 'Empresas',
        value: companyCount,
        icon: 'company',
        color: DEFAULT_COLORS.company,
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
          React.createElement('div', {
            key: i,
            className:
              'flex-1 min-w-[280px] h-[236px] rounded-2xl border border-[#707070] bg-white animate-pulse',
          })
        )
      : cards.map((card, i) =>
          React.createElement(
            'div',
            {
              key: i,
              className:
                'flex flex-col justify-center items-start px-7 gap-4 rounded-2xl flex-1 min-w-[280px] h-[236px] bg-white border border-[#707070]',
            },
            // Header: label + icon
            React.createElement(
              'div',
              { className: 'flex items-center gap-[10px] w-full' },
              React.createElement(
                'span',
                { className: 'text-black font-medium text-2xl leading-[29px] flex-1' },
                card.label
              ),
              React.createElement(
                'div',
                {
                  className:
                    'flex items-center justify-center w-[60px] h-[60px] rounded-lg border border-[#707070] flex-shrink-0',
                  style: { backgroundColor: card.color ?? DEFAULT_COLORS.total },
                },
                ICONS[(card.icon as keyof typeof ICONS) ?? 'users'] ?? ICONS.users
              )
            ),
            // Valor
            React.createElement(
              'span',
              { className: 'text-black font-medium text-6xl leading-tight' },
              card.value
            ),
            // Footer
            React.createElement(
              'span',
              { className: 'text-black/50 text-sm h-5' },
              card.footer ?? '\u00A0'
            )
          )
        )
  );
}
