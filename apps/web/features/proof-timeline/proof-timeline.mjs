// @ts-check

export const PROOF_TIMELINE_DEFAULT_TITLE = "Proof timeline";

/**
 * @param {import("./proof-timeline.d.ts").ProofTimelineInput} input
 * @returns {import("./proof-timeline.d.ts").ProofTimelineViewModel}
 */
export function createProofTimelineViewModel(input = {}) {
  const context = normalizeContext(input);
  const documents = input.documents ?? [];
  const items = (input.proofEvents ?? [])
    .filter((event) => matchesContext(event, context))
    .sort(compareOccurredAscending)
    .map((event) => toTimelineItem({
      context,
      documents,
      event,
    }));

  return Object.freeze({
    title: normalizeOptionalString(input.title) ?? PROOF_TIMELINE_DEFAULT_TITLE,
    emptyMessage: normalizeOptionalString(input.emptyMessage) ??
      "No proof events have been recorded for this context.",
    items: Object.freeze(items),
  });
}

/**
 * @param {import("./proof-timeline.d.ts").ProofTimelineRenderableInput} input
 * @returns {string}
 */
export function renderProofTimeline(input) {
  const timeline = "items" in input
    ? input
    : createProofTimelineViewModel(input);

  if (timeline.items.length === 0) {
    return `<section class="proof-timeline"><h2>${escapeHtml(timeline.title)}</h2><p>${escapeHtml(timeline.emptyMessage)}</p></section>`;
  }

  return [
    "<section class=\"proof-timeline\">",
    `  <h2>${escapeHtml(timeline.title)}</h2>`,
    "  <ol>",
    timeline.items.map((item) => [
      `    <li data-verification-level="${escapeAttribute(item.verificationLevel)}">`,
      `      <strong>${escapeHtml(item.eventType)}</strong>`,
      `      <span>${escapeHtml(item.occurredAt)}</span>`,
      `      <span>${escapeHtml(item.actorRoleCode)}</span>`,
      `      <span>${escapeHtml(item.actorOrganizationId ?? "Organization not recorded")}</span>`,
      `      <span>${escapeHtml(item.verificationLevel)}</span>`,
      `      <span>${escapeHtml(item.linkedDocumentLabel)}</span>`,
      "    </li>",
    ].join("\n")).join("\n"),
    "  </ol>",
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./proof-timeline.d.ts").ProofTimelineInput} input
 * @returns {import("./proof-timeline.d.ts").ProofTimelineContext}
 */
function normalizeContext(input) {
  return Object.freeze({
    orderId: normalizeOptionalString(input.orderId),
    orderNumber: normalizeOptionalString(input.orderNumber),
    shipmentIds: Object.freeze(new Set((input.shipmentIds ?? []).map(normalizeOptionalString).filter(Boolean))),
  });
}

/**
 * @param {import("./proof-timeline.d.ts").ProofEventLike} event
 * @param {import("./proof-timeline.d.ts").ProofTimelineContext} context
 * @returns {boolean}
 */
function matchesContext(event, context) {
  if (!context.orderId && !context.orderNumber && context.shipmentIds.size === 0) {
    return true;
  }

  return Boolean(
    (context.orderId && event.semenOrderId === context.orderId) ||
    (context.orderNumber && event.orderNumber === context.orderNumber) ||
    (event.shipmentId && context.shipmentIds.has(event.shipmentId)),
  );
}

/**
 * @param {{
 *   context: import("./proof-timeline.d.ts").ProofTimelineContext;
 *   documents: readonly import("./proof-timeline.d.ts").DocumentLike[];
 *   event: import("./proof-timeline.d.ts").ProofEventLike;
 * }} input
 * @returns {import("./proof-timeline.d.ts").ProofTimelineItem}
 */
function toTimelineItem(input) {
  const documentationCount = countLinkedDocuments(input.event, input.documents);

  return Object.freeze({
    id: normalizeOptionalString(input.event.id),
    eventType: input.event.eventType,
    source: input.event.source,
    lifecycleStage: input.event.lifecycleStage,
    verificationLevel: input.event.verificationLevel,
    status: input.event.status,
    actorRoleCode: input.event.actorRoleCode,
    actorOrganizationId: normalizeOptionalString(input.event.actorOrganizationId),
    organizationLabel: normalizeOptionalString(input.event.actorOrganizationId),
    linkedObjectLabel: linkedObjectLabel(input.event, input.context),
    documentationCount,
    linkedDocumentLabel: `${documentationCount} linked document${documentationCount === 1 ? "" : "s"}`,
    occurredAt: input.event.occurredAt,
  });
}

/**
 * @param {import("./proof-timeline.d.ts").ProofEventLike} event
 * @param {import("./proof-timeline.d.ts").ProofTimelineContext} context
 * @returns {string}
 */
function linkedObjectLabel(event, context) {
  if (event.shipmentId) {
    return `Shipment ${event.shipmentId}`;
  }

  if (event.orderNumber ?? context.orderNumber) {
    return `Order ${event.orderNumber ?? context.orderNumber}`;
  }

  if (event.semenOrderId ?? context.orderId) {
    return `Order ${event.semenOrderId ?? context.orderId}`;
  }

  return "Proof context";
}

/**
 * @param {import("./proof-timeline.d.ts").ProofEventLike} event
 * @param {readonly import("./proof-timeline.d.ts").DocumentLike[]} documents
 * @returns {number}
 */
function countLinkedDocuments(event, documents) {
  const refs = new Set();

  for (const ref of event.documentationRefs ?? []) {
    if (ref && typeof ref === "object" && "documentId" in ref) {
      const documentId = normalizeOptionalString(ref.documentId);

      if (documentId) {
        refs.add(documentId);
      }
    }
  }

  const eventId = normalizeOptionalString(event.id);

  for (const document of documents) {
    if (
      eventId &&
      (
        document.proofEventId === eventId ||
        (document.targetType === "ProofEvent" && document.targetId === eventId)
      )
    ) {
      refs.add(normalizeOptionalString(document.id) ?? document.originalFileName);
    }
  }

  return refs.size;
}

function compareOccurredAscending(left, right) {
  return left.occurredAt.localeCompare(right.occurredAt) ||
    String(left.id ?? "").localeCompare(String(right.id ?? ""));
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
