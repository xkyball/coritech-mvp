import type {
  DocumentLike as ApiDocumentLike,
} from "@coritech/domain/documents/document-evidence.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type { ActivePhase1VerificationLevel } from "@coritech/domain/proof/verification-level.d.ts";

export interface ProofEventLike extends ProofEvent {}
export interface DocumentLike extends ApiDocumentLike {}

export interface ProofTimelineInput {
  title?: string | null;
  emptyMessage?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  shipmentIds?: readonly (string | null | undefined)[];
  proofEvents?: readonly ProofEventLike[];
  documents?: readonly DocumentLike[];
}

export interface ProofTimelineContext {
  orderId: string | null;
  orderNumber: string | null;
  shipmentIds: ReadonlySet<string>;
}

export interface ProofTimelineItem {
  id: string | null;
  eventType: ProofEvent["eventType"];
  source: ProofEvent["source"];
  lifecycleStage: ProofEvent["lifecycleStage"];
  verificationLevel: ActivePhase1VerificationLevel;
  status: ProofEvent["status"];
  actorRoleCode: ProofEvent["actorRoleCode"];
  actorOrganizationId: string | null;
  organizationLabel: string | null;
  linkedObjectLabel: string;
  documentationCount: number;
  linkedDocumentLabel: string;
  occurredAt: string;
}

export interface ProofTimelineViewModel {
  title: string;
  emptyMessage: string;
  items: readonly ProofTimelineItem[];
}

export type ProofTimelineRenderableInput =
  | ProofTimelineInput
  | ProofTimelineViewModel;

export declare const PROOF_TIMELINE_DEFAULT_TITLE: "Proof timeline";

export declare function createProofTimelineViewModel(
  input?: ProofTimelineInput,
): ProofTimelineViewModel;

export declare function renderProofTimeline(
  input: ProofTimelineRenderableInput,
): string;
