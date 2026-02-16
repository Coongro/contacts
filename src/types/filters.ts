/**
 * Filtros para búsqueda de contactos.
 */
export type SortDirection = 'asc' | 'desc';

export interface ContactFilters {
  query?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: SortDirection;
}
