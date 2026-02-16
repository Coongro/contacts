/**
 * Tabla de contactos con búsqueda, filtros y paginación.
 * Extensible via extraColumns, extraActions, extraFilters.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useContacts } from '../hooks/useContacts.js';
import type { ContactsTableProps, ColumnDef } from '../types/components.js';
import type { SortDirection } from '../types/filters.js';

const React = getHostReact();
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
        'span',
        {
          className: c.is_active
            ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cg-success-bg)] text-[var(--cg-success)]'
            : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--cg-bg-tertiary)] text-[var(--cg-text-muted)]',
        },
        c.is_active ? 'Activo' : 'Inactivo'
      ),
  },
];

function formatType(type: string): string {
  const labels: Record<string, string> = {
    person: 'Persona',
    company: 'Empresa',
    other: 'Otro',
  };
  return labels[type] ?? type;
}

export function ContactsTable(props: ContactsTableProps) {
  const {
    filters: initialFilters,
    columns,
    extraColumns = [],
    extraActions = [],
    extraFilters: _extraFilters = [],
    onRowClick,
    selectable = false,
    onSelectionChange,
    pageSize = 20,
    className = '',
    emptyMessage = 'No se encontraron contactos',
  } = props;

  const { data, loading, error, setFilters, setSort, pagination, nextPage, prevPage, refetch } =
    useContacts({
      ...initialFilters,
      pageSize,
    });

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>(initialFilters?.type ?? '');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const allColumns = useMemo(
    () => [...(columns ?? DEFAULT_COLUMNS), ...extraColumns],
    [columns, extraColumns]
  );

  const handleSearch = useCallback(
    (e: { target: { value: string } }) => {
      const value = e.target.value;
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
    (key: string) => {
      if (!SORTABLE_KEYS.has(key)) return;
      const newDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
      setSortKey(key);
      setSortDir(newDir);
      setSort(key, newDir);
    },
    [sortKey, sortDir, setSort]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange]
  );

  const toggleAllSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = data.every((c) => prev.has(c.id));
      const next = allSelected ? new Set<string>() : new Set(data.map((c) => c.id));
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [data, onSelectionChange]);

  // --- Render ---

  if (error) {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center justify-center py-12 gap-3' },
      React.createElement('p', { className: 'text-sm text-[var(--cg-danger)]' }, error),
      React.createElement(
        'button',
        {
          onClick: () => refetch(),
          className:
            'px-4 py-2 text-sm rounded-lg bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] hover:bg-[var(--cg-accent-hover)] transition-colors',
        },
        'Reintentar'
      )
    );
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // Barra de búsqueda y filtros
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      React.createElement(
        'div',
        { className: 'relative flex-1' },
        React.createElement(
          'svg',
          {
            className: 'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cg-text-muted)]',
            width: 16,
            height: 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
          },
          React.createElement('circle', { cx: 11, cy: 11, r: 8 }),
          React.createElement('path', { d: 'M21 21l-4.35-4.35' })
        ),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Buscar contactos...',
          value: searchValue,
          onChange: handleSearch,
          className:
            'w-full h-9 pl-10 pr-4 text-sm rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)] text-[var(--cg-text)] placeholder:text-[var(--cg-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--cg-border-focus)]',
        })
      ),
      // Filtro de tipo
      React.createElement(
        'div',
        { className: 'flex gap-1' },
        ['', 'person', 'company', 'other'].map((type) =>
          React.createElement(
            'button',
            {
              key: type,
              onClick: () => handleTypeFilter(type),
              className: `px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeTypeFilter === type
                  ? 'bg-[var(--cg-accent)] text-[var(--cg-text-inverse)]'
                  : 'bg-[var(--cg-bg-secondary)] text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-tertiary)]'
              }`,
            },
            type === '' ? 'Todos' : formatType(type)
          )
        )
      )
    ),

    // Tabla
    React.createElement(
      'div',
      { className: 'overflow-x-auto rounded-lg border border-[var(--cg-border)]' },
      React.createElement(
        'table',
        { className: 'w-full' },
        // Header
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            { className: 'bg-[var(--cg-bg-secondary)] border-b border-[var(--cg-border)]' },
            selectable &&
              React.createElement(
                'th',
                { className: 'w-10 p-3' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: data.length > 0 && data.every((c) => selectedIds.has(c.id)),
                  onChange: toggleAllSelection,
                  className: 'rounded',
                })
              ),
            allColumns.map((col) => {
              const isSortable = SORTABLE_KEYS.has(col.key);
              const isActive = sortKey === col.key;
              const arrow = isActive ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';
              return React.createElement(
                'th',
                {
                  key: col.key,
                  onClick: isSortable ? () => handleSort(col.key) : undefined,
                  className: `text-left p-3 text-xs font-medium uppercase tracking-wider ${
                    isSortable ? 'cursor-pointer select-none hover:text-[var(--cg-text)]' : ''
                  } ${isActive ? 'text-[var(--cg-text)]' : 'text-[var(--cg-text-muted)]'} ${col.className ?? ''}`,
                },
                col.header + arrow
              );
            }),
            extraActions.length > 0 &&
              React.createElement(
                'th',
                {
                  className:
                    'w-24 p-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--cg-text-muted)]',
                },
                'Acciones'
              )
          )
        ),
        // Body
        React.createElement(
          'tbody',
          null,
          loading
            ? Array.from({ length: 5 }).map((_, i) =>
                React.createElement(
                  'tr',
                  { key: `skeleton-${i}`, className: 'border-b border-[var(--cg-border)]' },
                  Array.from({
                    length:
                      (selectable ? 1 : 0) + allColumns.length + (extraActions.length > 0 ? 1 : 0),
                  }).map((_, j) =>
                    React.createElement(
                      'td',
                      { key: j, className: 'p-3' },
                      React.createElement('div', {
                        className: 'h-4 rounded bg-[var(--cg-skeleton)] animate-pulse',
                        style: { width: `${60 + Math.random() * 40}%` },
                      })
                    )
                  )
                )
              )
            : data.length === 0
              ? React.createElement(
                  'tr',
                  null,
                  React.createElement(
                    'td',
                    {
                      colSpan:
                        (selectable ? 1 : 0) +
                        allColumns.length +
                        (extraActions.length > 0 ? 1 : 0),
                      className: 'p-12 text-center text-sm text-[var(--cg-text-muted)]',
                    },
                    emptyMessage
                  )
                )
              : data.map((contact) =>
                  React.createElement(
                    'tr',
                    {
                      key: contact.id,
                      onClick: () => onRowClick?.(contact),
                      className: `border-b border-[var(--cg-border)] transition-colors ${
                        onRowClick ? 'cursor-pointer hover:bg-[var(--cg-bg-hover)]' : ''
                      } ${selectedIds.has(contact.id) ? 'bg-[var(--cg-accent-bg)]' : ''}`,
                    },
                    selectable &&
                      React.createElement(
                        'td',
                        {
                          className: 'w-10 p-3',
                          onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                        },
                        React.createElement('input', {
                          type: 'checkbox',
                          checked: selectedIds.has(contact.id),
                          onChange: () => toggleSelection(contact.id),
                          className: 'rounded',
                        })
                      ),
                    allColumns.map((col) =>
                      React.createElement(
                        'td',
                        {
                          key: col.key,
                          className: `p-3 text-sm text-[var(--cg-text)] ${col.className ?? ''}`,
                        },
                        col.render
                          ? (col.render(contact) as React.ReactNode)
                          : (((contact as unknown as Record<string, unknown>)[
                              col.key
                            ] as React.ReactNode) ?? '—')
                      )
                    ),
                    extraActions.length > 0 &&
                      React.createElement(
                        'td',
                        {
                          className: 'p-3 text-right',
                          onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                        },
                        React.createElement(
                          'div',
                          { className: 'flex items-center justify-end gap-1' },
                          extraActions
                            .filter((a) => !a.hidden || !a.hidden(contact))
                            .map((action, i) =>
                              React.createElement(
                                'button',
                                {
                                  key: i,
                                  onClick: () => action.onClick(contact),
                                  title: action.label,
                                  className: `p-1.5 rounded-md text-xs transition-colors ${
                                    action.variant === 'destructive'
                                      ? 'text-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)]'
                                      : 'text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]'
                                  }`,
                                },
                                action.label
                              )
                            )
                        )
                      )
                  )
                )
        )
      )
    ),

    // Paginación
    !loading &&
      data.length > 0 &&
      React.createElement(
        'div',
        { className: 'flex items-center justify-between text-sm text-[var(--cg-text-muted)]' },
        React.createElement(
          'span',
          null,
          `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
        ),
        React.createElement(
          'div',
          { className: 'flex gap-2' },
          React.createElement(
            'button',
            {
              onClick: prevPage,
              disabled: pagination.page <= 1,
              className:
                'px-3 py-1.5 text-xs rounded-lg border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            },
            'Anterior'
          ),
          React.createElement(
            'button',
            {
              onClick: nextPage,
              disabled: pagination.page >= pagination.totalPages,
              className:
                'px-3 py-1.5 text-xs rounded-lg border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
            },
            'Siguiente'
          )
        )
      )
  );
}
