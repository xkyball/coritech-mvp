export type TableListDirection = "asc" | "desc";

export interface TableListQuery {
  query: string;
  page: number;
  pageSize: number;
  sort: string | null;
  direction: TableListDirection;
  filters: Readonly<Record<string, string>>;
}

export interface NormalizeTableListQueryOptions {
  allowedFilters?: readonly string[];
  allowedSorts?: readonly string[];
  defaultDirection?: TableListDirection | string | null;
  defaultPageSize?: number;
  defaultSort?: string | null;
  maxPageSize?: number;
}

export interface TableListPagination<TItem> {
  items: readonly TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export declare const TABLE_LIST_QUERY_PARAMS: Readonly<{
  query: "query";
  page: "page";
  pageSize: "pageSize";
  sort: "sort";
  direction: "direction";
}>;

export declare const TABLE_LIST_DIRECTIONS: readonly TableListDirection[];

export declare function normalizeTableListQuery(
  input: Record<string, unknown>,
  options?: NormalizeTableListQueryOptions,
): TableListQuery;

export declare function paginateTableItems<TItem>(
  items: readonly TItem[],
  requestedPage: number,
  pageSize: number,
): TableListPagination<TItem>;

export declare function buildTableListHref(input: {
  basePath: string;
  query: TableListQuery;
  page?: number;
  extraParams?: Record<string, string | number | null | undefined>;
}): string;
