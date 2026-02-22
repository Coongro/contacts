/**
 * Tabla de contactos con búsqueda, filtros y paginación.
 * Extensible via extraColumns, extraActions, extraFilters.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { formatType } from '../lib/formatType.js';
import { useContacts } from '../hooks/useContacts.js';
import type { ContactsTableProps, ColumnDef } from '../types/components.js';
import type { SortDirection } from '../types/filters.js';

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
    extraFilters: _extraFilters = [],
    onRowClick,
    selectable = false,
    onSelectionChange,
    pageSize = 20,
    className = '',
    emptyMessage = 'No se encontraron contactos',
  } = props;

  const { data, loading, error, setFilters, setSort, pagination, nextPage, prevPage, goToPage, refetch } =
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

  /** Mapeo de sort direction para TableHead */
  const getSortDirection = (colKey: string): false | 'asc' | 'desc' | undefined => {
    if (!SORTABLE_KEYS.has(colKey)) return undefined;
    if (sortKey === colKey) return sortDir as 'asc' | 'desc';
    return false;
  };

  const totalColSpan =
    (selectable ? 1 : 0) + allColumns.length + (extraActions.length > 0 ? 1 : 0);

  // --- Render ---

  if (error) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Error',
      message: error,
      onRetry: () => refetch(),
    });
  }

  return React.createElement(
    'div',
    { className: `flex flex-col gap-4 ${className}` },

    // Barra de búsqueda y filtros
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      // Busqueda con icono
      React.createElement(
        'div',
        { className: 'relative flex-1' },
        React.createElement(UI.DynamicIcon, {
          icon: 'Search',
          size: 16,
          className: 'absolute left-3 top-1/2 -translate-y-1/2 text-cg-text-muted',
        }),
        React.createElement(UI.Input, {
          type: 'text',
          placeholder: 'Buscar contactos...',
          value: searchValue,
          onChange: handleSearch,
          className: 'pl-10',
        })
      ),
      // Filtro de tipo
      React.createElement(
        UI.ButtonGroup,
        null,
        ['', 'person', 'company', 'other'].map((type) =>
          React.createElement(
            UI.ButtonGroupItem,
            {
              key: type,
              active: activeTypeFilter === type,
              onClick: () => handleTypeFilter(type),
            },
            type === '' ? 'Todos' : formatType(type)
          )
        )
      )
    ),

    // Tabla
    React.createElement(
      UI.Table,
      null,
      // Header
      React.createElement(
        UI.TableHeader,
        null,
        React.createElement(
          UI.TableRow,
          null,
          selectable &&
            React.createElement(
              UI.TableHead,
              { className: 'w-10' },
              React.createElement(UI.Checkbox, {
                checked: data.length > 0 && data.every((c) => selectedIds.has(c.id)),
                onCheckedChange: () => toggleAllSelection(),
              })
            ),
          allColumns.map((col) =>
            React.createElement(
              UI.TableHead,
              {
                key: col.key,
                sortDirection: getSortDirection(col.key),
                onSort: () => handleSort(col.key),
                className: col.className,
              },
              col.header
            )
          ),
          extraActions.length > 0 &&
            React.createElement(
              UI.TableHead,
              { className: 'w-24 text-right' },
              'Acciones'
            )
        )
      ),
      // Body
      React.createElement(
        UI.TableBody,
        null,
        loading
          ? Array.from({ length: 5 }).map((_, i) =>
              React.createElement(
                UI.TableRow,
                { key: `skeleton-${i}` },
                Array.from({ length: totalColSpan }).map((_, j) =>
                  React.createElement(
                    UI.TableCell,
                    { key: j },
                    React.createElement(UI.Skeleton, { className: 'h-4' })
                  )
                )
              )
            )
          : data.length === 0
            ? React.createElement(
                UI.TableRow,
                null,
                React.createElement(
                  UI.TableCell,
                  { colSpan: totalColSpan, className: 'p-0' },
                  React.createElement(UI.EmptyState, { title: emptyMessage })
                )
              )
            : data.map((contact) =>
                React.createElement(
                  UI.TableRow,
                  {
                    key: contact.id,
                    onClick: onRowClick ? () => onRowClick(contact) : undefined,
                    className: `${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${selectedIds.has(contact.id) ? 'bg-cg-accent-bg' : ''}`,
                  },
                  selectable &&
                    React.createElement(
                      UI.TableCell,
                      {
                        className: 'w-10',
                        onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                      },
                      React.createElement(UI.Checkbox, {
                        checked: selectedIds.has(contact.id),
                        onCheckedChange: () => toggleSelection(contact.id),
                      })
                    ),
                  allColumns.map((col) =>
                    React.createElement(
                      UI.TableCell,
                      { key: col.key, className: col.className },
                      col.render
                        ? (col.render(contact) as React.ReactNode)
                        : (((contact as unknown as Record<string, unknown>)[
                            col.key
                          ] as React.ReactNode) ?? '—')
                    )
                  ),
                  extraActions.length > 0 &&
                    React.createElement(
                      UI.TableCell,
                      {
                        className: 'text-right',
                        onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
                      },
                      React.createElement(
                        'div',
                        { className: 'flex items-center justify-end gap-1' },
                        extraActions
                          .filter((a) => !a.hidden || !a.hidden(contact))
                          .map((action, i) =>
                            React.createElement(
                              UI.Button,
                              {
                                key: i,
                                variant: action.variant === 'destructive' ? 'destructive' : 'ghost',
                                size: 'xs',
                                onClick: () => action.onClick(contact),
                                title: action.label,
                              },
                              action.label
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
        { className: 'flex items-center justify-between' },
        React.createElement(
          'span',
          { className: 'text-xs text-cg-text-muted' },
          `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
        ),
        React.createElement(
          UI.Pagination,
          null,
          React.createElement(
            UI.PaginationContent,
            null,
            React.createElement(UI.PaginationPrevious, {
              onClick: prevPage,
              disabled: pagination.page <= 1,
            }),
            ...Array.from({ length: pagination.totalPages }, (_, i) => {
              const page = i + 1;
              // Mostrar primera, última, y ±1 de la actual; el resto ellipsis
              const isCurrent = page === pagination.page;
              const isNearCurrent = Math.abs(page - pagination.page) <= 1;
              const isEdge = page === 1 || page === pagination.totalPages;

              if (isCurrent || isNearCurrent || isEdge) {
                return React.createElement(
                  UI.PaginationItem,
                  { key: page },
                  React.createElement(UI.PaginationLink, {
                    isActive: isCurrent,
                    onClick: () => goToPage(page),
                  }, String(page))
                );
              }
              // Ellipsis solo en el primer gap
              if (page === 2 || page === pagination.totalPages - 1) {
                return React.createElement(
                  UI.PaginationItem,
                  { key: `ellipsis-${page}` },
                  React.createElement(UI.PaginationEllipsis)
                );
              }
              return null;
            }).filter(Boolean),
            React.createElement(UI.PaginationNext, {
              onClick: nextPage,
              disabled: pagination.page >= pagination.totalPages,
            })
          )
        )
      )
  );
}
