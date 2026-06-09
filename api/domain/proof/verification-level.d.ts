import type {
  ProofEventActorRoleCode,
  ProofEventType,
} from "./proof-event.d.ts";

export type ActivePhase1VerificationLevel =
  | "SELF_REPORTED"
  | "SYSTEM_RECORDED"
  | "STATION_CONFIRMED"
  | "ADMIN_REVIEWED";

export type FutureVerificationLevel =
  | "VET_SIGNED"
  | "FEDERATION_ATTESTED"
  | "VERIFIED_FOR_TRANSACTION";

export type VerificationLevel =
  | ActivePhase1VerificationLevel
  | FutureVerificationLevel;

export type VerificationLevelBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "review"
  | "future";

export interface VerificationLevelMetadata {
  code: VerificationLevel;
  label: string;
  badgeLabel: string;
  badgeTone: VerificationLevelBadgeTone;
  activeInPhase1: boolean;
  phase: "Phase 1" | "Future";
  sortOrder: number;
  description: string;
}

export interface DeriveVerificationLevelInput {
  eventType: ProofEventType | string;
  actorRoleCode: ProofEventActorRoleCode | string;
}

export declare const VERIFICATION_LEVEL_METADATA: readonly Readonly<VerificationLevelMetadata>[];
export declare const VERIFICATION_LEVELS: readonly VerificationLevel[];
export declare const ACTIVE_PHASE_1_VERIFICATION_LEVELS: readonly ActivePhase1VerificationLevel[];
export declare const FUTURE_VERIFICATION_LEVELS: readonly FutureVerificationLevel[];

export declare function isVerificationLevel(
  value: unknown,
): value is VerificationLevel;
export declare function isActivePhase1VerificationLevel(
  value: unknown,
): value is ActivePhase1VerificationLevel;
export declare function verificationLevelMetadataFor(
  value: unknown,
): Readonly<VerificationLevelMetadata> | null;
export declare function deriveVerificationLevel(
  input: DeriveVerificationLevelInput,
): ActivePhase1VerificationLevel | null;
