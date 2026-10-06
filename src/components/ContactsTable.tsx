/**
 * Tabla de contactos con búsqueda, filtros y paginación.
 * Extensible via extraColumns, extraActions, extraFilters.
 * Usa DataTable de ui-components con mobileRender para cards en móvil.
 */
import { Badge, DataTable } from '@coongro/ui-components';
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useContacts } from '../hooks/useContacts.js';
import { formatType } from '../lib/formatType.js';
import type { ContactsTableProps, ColumnDef } from '../types/components.js';
import type { Contact } from '../types/contact.js';

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
    render: (c) => (
      <Badge variant={c.is_active ? 'success-soft' : 'secondary'} size="sm">
        {c.is_active ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export function ContactsTable(props: ContactsTableProps): ReactElement {
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
      // `ColumnDef.render` es público y devuelve `unknown`; DataTable pide un nodo.
      render: col.render as ((item: Contact) => ReactNode) | undefined,
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
    (contact: Contact) => (
      <div className="flex flex-col gap-1">
        {/* Nombre */}
        <span className="font-medium text-sm">{contact.name}</span>
        {/* Tipo · Teléfono */}
        <div className="text-xs" style={{ color: 'var(--cg-text-muted)' }}>
          {[formatType(contact.type), contact.phone].filter(Boolean).join(' · ')}
        </div>
        {/* Email */}
        {contact.email && (
          <div className="text-xs" style={{ color: 'var(--cg-text-muted)' }}>
            {contact.email}
          </div>
        )}
        {/* Badge de estado */}
        <div className="mt-1">
          <Badge variant={contact.is_active ? 'success-soft' : 'secondary'} size="sm">
            {contact.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </div>
    ),
    []
  );

  return (
    <DataTable
      data={data}
      rowKey={(contact: Contact) => contact.id}
      loading={loading}
      error={error ?? undefined}
      onRetry={() => void refetch()}
      columns={dtColumns}
      searchPlaceholder="Buscar contactos..."
      searchValue={searchValue}
      onSearchChange={handleSearch}
      filterSections={[
        {
          label: 'Tipo',
          options: ['', 'person', 'company', 'other'].map((type) => ({
            value: type,
            label: type === '' ? 'Todos' : formatType(type),
          })),
          value: activeTypeFilter,
          onChange: handleTypeFilter,
        },
      ]}
      sortKey={sortKey}
      sortDirection={sortDir}
      onSortChange={handleSort}
      pagination={{
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      }}
      onPageChange={goToPage}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={handleSelectionChange}
      actions={dtActions}
      onRowClick={onRowClick}
      emptyState={{
        title: emptyMessage,
        filteredTitle: 'Sin resultados',
        filteredDescription: 'No se encontraron contactos con los filtros actuales.',
      }}
      mobileRender={mobileRender}
      className={className}
    />
  );
}
