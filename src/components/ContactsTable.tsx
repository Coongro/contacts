/**
 * Tabla de contactos con búsqueda, filtros y paginación.
 * Extensible via extraColumns, extraActions, extraFilters.
 * Usa DataTable de ui-components con mobileRender para cards en móvil.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContacts } from '../hooks/useContacts.js';
import { formatType } from '../lib/formatType.js';
import type { ContactsTableProps, ColumnDef } from '../types/components.js';
import type { Contact } from '../types/contact.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback, useMemo } = React;

// Columnas que soportan ordenamiento (deben coincidir con sortableColumns del repo)
const SORTABLE_KEYS = new Set(['name', 'type', 'phone', 'email', 'is_active', 'created_at']);

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'type', header: 'Tipo', render: (c) => formatType(c.type) },
  { key: 'phone', header: 'Teléfono', render: (c) => c.phone ?? '—' },
  { key: 'email', header: 'Email', render: (c) => c.email ?? '—' },
  {
    key: 'is_active',
    header: 'Estado',
    render: (c) =>
      React.createElement(
        UI.Badge,
        {
          variant: c.is_active ? 'success-soft' : 'secondary',
          size: 'sm',
        },
        c.is_active ? 'Activo' : 'Inactivo'
      ),
  },
];

export function ContactsTable(props: ContactsTableProps) {
  const {
    filters: initialFilters,
    columns,
    extraColumns = [],
    extraActions = [],
    onRowClick,
    selectable = false,
    onSelectionChange,
    pageSize = 20,
    className = '',
    emptyMessage = 'No se encontraron contactos',
  } = props;

  const { data, loading, error, setFilters, setSort, pagination, goToPage, refetch } = useContacts({
    ...initialFilters,
    pageSize,
  });

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>(initialFilters?.type ?? '');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  // Columnas en formato DataTable
  const dtColumns = useMemo(() => {
    const base = columns ?? DEFAULT_COLUMNS;
    return [...base, ...extraColumns].map((col) => ({
      ...col,
      sortable: SORTABLE_KEYS.has(col.key),
    }));
  }, [columns, extraColumns]);

  // Acciones en formato DataTable
  const dtActions = useMemo(() => {
    if (extraActions.length === 0) return undefined;
    return extraActions.map((a) => ({
      label: a.label,
      onClick: a.onClick,
      variant: a.variant as 'ghost' | 'destructive' | undefined,
      hidden: a.hidden,
    }));
  }, [extraActions]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      setFilters({
        query: value || undefined,
        type: activeTypeFilter || undefined,
      });
    },
    [setFilters, activeTypeFilter]
  );

  const handleTypeFilter = useCallback(
    (type: string) => {
      setActiveTypeFilter(type);
      setFilters({
        query: searchValue || undefined,
        type: type || undefined,
      });
    },
    [setFilters, searchValue]
  );

  const handleSort = useCallback(
    (key: string, direction: 'asc' | 'desc' | null) => {
      if (!SORTABLE_KEYS.has(key)) return;
      setSortKey(direction ? key : null);
      setSortDir(direction);
      setSort(key, direction ?? 'asc');
    },
    [setSort]
  );

  const handleSelectionChange = useCallback(
    (ids: Set<string>) => {
      setSelectedIds(ids);
      onSelectionChange?.(Array.from(ids));
    },
    [onSelectionChange]
  );

  // Card para vista móvil
  const mobileRender = useCallback(
    (contact: Contact) =>
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1' },
        // Nombre
        React.createElement('span', { className: 'font-medium text-sm' }, contact.name),
        // Tipo · Teléfono
        React.createElement(
          'div',
          { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
          [formatType(contact.type), contact.phone].filter(Boolean).join(' · ')
        ),
        // Email
        contact.email &&
          React.createElement(
            'div',
            { className: 'text-xs', style: { color: 'var(--cg-text-muted)' } },
            contact.email
          ),
        // Badge de estado
        React.createElement(
          'div',
          { className: 'mt-1' },
          React.createElement(
            UI.Badge,
            {
              variant: contact.is_active ? 'success-soft' : 'secondary',
              size: 'sm',
            },
            contact.is_active ? 'Activo' : 'Inactivo'
          )
        )
      ),
    []
  );

  return React.createElement(UI.DataTable, {
    data,
    rowKey: (contact: Contact) => contact.id,
    loading,
    error: error ?? undefined,
    onRetry: refetch,
    columns: dtColumns,
    searchPlaceholder: 'Buscar contactos...',
    searchValue,
    onSearchChange: handleSearch,
    filterSections: [
      {
        label: 'Tipo',
        options: ['', 'person', 'company', 'other'].map((type) => ({
          value: type,
          label: type === '' ? 'Todos' : formatType(type),
        })),
        value: activeTypeFilter,
        onChange: handleTypeFilter,
      },
    ],
    sortKey,
    sortDirection: sortDir,
    onSortChange: handleSort,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
    },
    onPageChange: goToPage,
    selectable,
    selectedIds,
    onSelectionChange: handleSelectionChange,
    actions: dtActions,
    onRowClick,
    emptyState: {
      title: emptyMessage,
      filteredTitle: 'Sin resultados',
      filteredDescription: 'No se encontraron contactos con los filtros actuales.',
    },
    mobileRender,
    className,
  });
}
