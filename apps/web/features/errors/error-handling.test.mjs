import assert from "node:assert/strict";
import test from "node:test";

import {
  createAccessDeniedViewModel,
  createNotFoundViewModel,
  createRuntimeErrorLogEvent,
  formatValidationSummary,
  mapApiErrorToUi,
  normalizeValidationIssues,
  reportRuntimeError,
} from "./error-handling.mjs";

test("API error mapper preserves standard validation issues", () => {
  const result = mapApiErrorToUi({
    status: 422,
    body: {
      error: {
        code: "VALIDATION_FAILED",
        message: "Check quantity.",
        details: {
          issues: [{ field: "quantity", message: "Quantity must be at least 1." }],
        },
      },
    },
  });

  assert.equal(result.kind, "validation");
  assert.equal(result.code, "VALIDATION_FAILED");
  assert.equal(result.message, "Check quantity.");
  assert.deepEqual(result.validationIssues, [
    { field: "quantity", message: "Quantity must be at least 1." },
  ]);
});

test("API error mapper guides auth and permission failures without leaking object detail", () => {
  assert.deepEqual(
    mapApiErrorToUi({ status: 401 }).actionHref,
    "/login",
  );

  const forbidden = mapApiErrorToUi({
    status: 403,
    body: {
      error: {
        code: "FORBIDDEN",
        message: "Order ord_sensitive exists but belongs to another station.",
      },
    },
  });

  assert.equal(forbidden.kind, "forbidden");
  assert.equal(forbidden.title, "Access denied");
});

test("unexpected API errors use safe user-facing messages", () => {
  const result = mapApiErrorToUi({
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Prisma SQL stack trace includes secret_token",
      },
    },
  });

  assert.equal(result.kind, "unexpected");
  assert.match(result.message, /Something went wrong/);
  assert.doesNotMatch(result.message, /Prisma|secret|SQL/i);
});

test("validation issue helper normalizes arrays, strings and summaries", () => {
  const issues = normalizeValidationIssues({
    issues: [
      "Order note is required.",
      { path: "deliveryRegion", issue: "Delivery region must be selected." },
    ],
  });

  assert.deepEqual(issues, [
    { field: null, message: "Order note is required." },
    { field: "deliveryRegion", message: "Delivery region must be selected." },
  ]);
  assert.equal(formatValidationSummary(issues), "2 fields need attention before this can be saved.");
});

test("access denied and not found surface models are safe to render", () => {
  const denied = createAccessDeniedViewModel({
    reason: "The active station context cannot open this workspace.",
  });
  const notFound = createNotFoundViewModel({ resourceLabel: "order" });

  assert.equal(denied.badge, "403");
  assert.equal(denied.actionHref, "/app");
  assert.equal(notFound.badge, "404");
  assert.match(notFound.message, /does not disclose/);
});

test("runtime error logging hook redacts sensitive context", () => {
  const event = createRuntimeErrorLogEvent(
    Object.assign(new Error("boom"), { digest: "digest-1" }),
    {
      route: "/app/orders/new",
      token: "secret-token",
      retryCount: 1,
    },
  );

  assert.deepEqual(event, {
    eventType: "runtime_error",
    digest: "digest-1",
    name: "Error",
    context: {
      route: "/app/orders/new",
      retryCount: 1,
    },
  });

  const logged = [];
  reportRuntimeError(new Error("boom"), { route: "/app" }, (entry) => logged.push(entry));
  assert.equal(logged.length, 1);
});
