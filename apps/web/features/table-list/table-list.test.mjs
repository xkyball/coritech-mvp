import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTableListHref,
  normalizeTableListQuery,
  paginateTableItems,
} from "./table-list.mjs";

test("table list query normalizes page, size, filters and sort whitelist", () => {
  assert.deepEqual(
    normalizeTableListQuery(
      {
        direction: "sideways",
        page: "3",
        pageSize: "500",
        query: " SO-2026 ",
        sort: "unsafeField",
        status: "CONFIRMED",
        objectType: "SemenOrder",
        ignored: "x",
      },
      {
        allowedFilters: ["status", "objectType"],
        allowedSorts: ["updatedAt", "orderNumber"],
        defaultDirection: "desc",
        defaultSort: "updatedAt",
        maxPageSize: 100,
      },
    ),
    {
      direction: "desc",
      filters: {
        objectType: "SemenOrder",
        status: "CONFIRMED",
      },
      page: 3,
      pageSize: 100,
      query: "SO-2026",
      sort: "updatedAt",
    },
  );
});

test("table list pagination clamps page and exposes stable totals", () => {
  const page = paginateTableItems(["a", "b", "c", "d", "e"], 3, 2);

  assert.deepEqual(page, {
    items: ["e"],
    page: 3,
    pageSize: 2,
    totalItems: 5,
    totalPages: 3,
    hasNextPage: false,
    hasPreviousPage: true,
  });
  assert.equal(paginateTableItems(["a"], 99, 10).page, 1);
});

test("table list href preserves standard params and allowed filters", () => {
  const query = normalizeTableListQuery(
    {
      direction: "asc",
      page: "2",
      pageSize: "25",
      query: "mare",
      sort: "orderNumber",
      status: "SUBMITTED",
    },
    {
      allowedFilters: ["status"],
      allowedSorts: ["updatedAt", "orderNumber"],
      defaultSort: "updatedAt",
    },
  );

  assert.equal(
    buildTableListHref({
      basePath: "/app/admin/orders",
      page: 4,
      query,
    }),
    "/app/admin/orders?query=mare&sort=orderNumber&direction=asc&pageSize=25&page=4&status=SUBMITTED",
  );
});
