// @ts-check

export const TABLE_LIST_QUERY_PARAMS = Object.freeze({
  query: "query",
  page: "page",
  pageSize: "pageSize",
  sort: "sort",
  direction: "direction",
});

export const TABLE_LIST_DIRECTIONS = /** @type {const} */ ([
  "asc",
  "desc",
]);

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * @param {Record<string, unknown>} input
 * @param {import("./table-list.d.ts").NormalizeTableListQueryOptions} [options]
 * @returns {import("./table-list.d.ts").TableListQuery}
 */
export function normalizeTableListQuery(input, options = {}) {
  const allowedSorts = options.allowedSorts ?? [];
  const defaultSort = allowedSorts.includes(options.defaultSort ?? "")
    ? options.defaultSort ?? null
    : allowedSorts[0] ?? null;
  const sort = normalizeAllowedOption(input.sort, allowedSorts) ?? defaultSort;
  const defaultDirection = normalizeAllowedOption(
    options.defaultDirection,
    TABLE_LIST_DIRECTIONS,
  ) ?? "asc";
  const direction = normalizeAllowedOption(input.direction, TABLE_LIST_DIRECTIONS) ??
    defaultDirection;
  const filters = normalizeFilters(input.filters ?? input, options.allowedFilters ?? []);

  return Object.freeze({
    query: normalizeOptionalString(input.query) ?? "",
    page: normalizePositiveInteger(input.page, DEFAULT_PAGE),
    pageSize: normalizeBoundedInteger(
      input.pageSize,
      options.defaultPageSize ?? DEFAULT_PAGE_SIZE,
      1,
      options.maxPageSize ?? MAX_PAGE_SIZE,
    ),
    sort,
    direction,
    filters,
  });
}

/**
 * @template T
 * @param {readonly T[]} items
 * @param {number} requestedPage
 * @param {number} pageSize
 * @returns {import("./table-list.d.ts").TableListPagination<T>}
 */
export function paginateTableItems(items, requestedPage, pageSize) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return Object.freeze({
    items: Object.freeze(items.slice(start, start + pageSize)),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
}

/**
 * @param {{
 *   basePath: string;
 *   query: import("./table-list.d.ts").TableListQuery;
 *   page?: number;
 *   extraParams?: Record<string, string | number | null | undefined>;
 * }} input
 * @returns {string}
 */
export function buildTableListHref(input) {
  const params = new URLSearchParams();
  const page = input.page ?? input.query.page;

  if (input.query.query) {
    params.set(TABLE_LIST_QUERY_PARAMS.query, input.query.query);
  }

  if (input.query.sort) {
    params.set(TABLE_LIST_QUERY_PARAMS.sort, input.query.sort);
  }

  params.set(TABLE_LIST_QUERY_PARAMS.direction, input.query.direction);
  params.set(TABLE_LIST_QUERY_PARAMS.pageSize, String(input.query.pageSize));
  params.set(TABLE_LIST_QUERY_PARAMS.page, String(Math.max(1, page)));

  for (const [key, value] of Object.entries(input.query.filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(input.extraParams ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();

  return queryString ? `${input.basePath}?${queryString}` : input.basePath;
}

/**
 * @param {Record<string, unknown>} input
 * @param {readonly string[]} allowedFilters
 * @returns {Readonly<Record<string, string>>}
 */
function normalizeFilters(input, allowedFilters) {
  const entries = [];

  for (const key of allowedFilters) {
    const value = normalizeOptionalString(input[key]);

    if (value) {
      entries.push([key, value]);
    }
  }

  return Object.freeze(Object.fromEntries(entries));
}

/**
 * @template {string} T
 * @param {unknown} value
 * @param {readonly T[]} options
 * @returns {T | null}
 */
function normalizeAllowedOption(value, options) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  return options.includes(/** @type {T} */ (normalized))
    ? /** @type {T} */ (normalized)
    : null;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizePositiveInteger(value, fallback) {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isInteger(number) && number >= 1 ? number : fallback;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalizeBoundedInteger(value, fallback, min, max) {
  const number = normalizePositiveInteger(value, fallback);

  return Math.min(Math.max(number, min), max);
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}
