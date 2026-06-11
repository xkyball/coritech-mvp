import type { AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type { SemenOrder } from "@coritech/domain/orders/semen-order.d.ts";
import type { PaymentReference } from "@coritech/domain/payments/payment-reference.d.ts";

import type { ActiveContextActor } from "../auth/active-context-server";
import {
  PaymentReferenceUiAuthorizationError,
  PaymentReferenceUiValidationError,
  executePaymentReferenceMutation,
} from "./payment-reference-ui.mjs";
import type { PrismaPaymentReferenceRepository } from "./prisma-payment-reference-repository";

type PaymentReferenceOrderRepository = {
  findSemenOrderById(orderId: string): Promise<SemenOrder | null>;
};

export type SaveManualPaymentReferenceResult =
  | {
      ok: true;
      order: SemenOrder;
      paymentReference: PaymentReference;
    }
  | {
      ok: false;
      orderId: string;
      issues: readonly string[];
    };

export async function saveManualPaymentReference(input: {
  actor: ActiveContextActor;
  auditContext?: AuditRequestContext | null;
  formData: FormData;
  orderRepository: PaymentReferenceOrderRepository;
  paymentReferenceRepository: PrismaPaymentReferenceRepository;
}): Promise<SaveManualPaymentReferenceResult> {
  const orderId = formValue(input.formData, "orderId");

  if (!orderId) {
    return {
      ok: false,
      orderId: "",
      issues: ["orderId is required."],
    };
  }

  const order = await input.orderRepository.findSemenOrderById(orderId);

  if (!order || !order.id) {
    return {
      ok: false,
      orderId,
      issues: [`SemenOrder was not found: ${orderId}`],
    };
  }

  try {
    const existingPaymentReference = await findExistingPaymentReference({
      formData: input.formData,
      orderId: order.id,
      repository: input.paymentReferenceRepository,
    });
    const result = await executePaymentReferenceMutation({
      actor: input.actor,
      auditContext: input.auditContext,
      existingPaymentReference,
      order,
      repository: input.paymentReferenceRepository,
      values: input.formData,
    });

    return {
      ok: true,
      order,
      paymentReference: result.paymentReference,
    };
  } catch (error) {
    return {
      ok: false,
      orderId,
      issues: errorToIssues(error),
    };
  }
}

async function findExistingPaymentReference(input: {
  formData: FormData;
  orderId: string;
  repository: PrismaPaymentReferenceRepository;
}) {
  const paymentReferenceId = formValue(input.formData, "paymentReferenceId");

  if (paymentReferenceId) {
    const paymentReference = await input.repository.findPaymentReferenceById(paymentReferenceId);

    if (!paymentReference) {
      throw new PaymentReferenceUiValidationError([
        `PaymentReference was not found: ${paymentReferenceId}`,
      ]);
    }

    return paymentReference;
  }

  return input.repository.findLatestPaymentReferenceForOrder(input.orderId);
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function errorToIssues(error: unknown) {
  const issues = extractIssues(error);

  if (issues) {
    return issues;
  }

  if (
    error instanceof PaymentReferenceUiAuthorizationError ||
    error instanceof Error
  ) {
    return [error.message];
  }

  return ["Payment reference update failed."];
}

function extractIssues(error: unknown) {
  if (!error || typeof error !== "object" || !Array.isArray((error as { issues?: unknown }).issues)) {
    return null;
  }

  return (error as { issues: unknown[] }).issues
    .filter((issue): issue is string => typeof issue === "string");
}
