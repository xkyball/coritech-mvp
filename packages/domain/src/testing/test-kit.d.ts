import type {
  ActiveContextActor,
  ActiveContextAttribution,
  ActiveOrganizationRoleContext,
} from "../identity/active-context.d.ts";
import type {
  OrganizationType,
  Phase1RoleCode,
  UserStatus,
} from "../identity/role-model.d.ts";

export type TestUser = {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
};

export type TestOrganization = {
  id: string;
  name: string;
  organizationType: OrganizationType;
  status: "ACTIVE" | "DISABLED";
};

export type TestRoleAssignment = {
  id: string;
  userId: string;
  organizationId: string;
  roleCode: Phase1RoleCode;
  revokedAt: string | null;
};

export type CreateMockActiveContextInput = {
  user?: TestUser;
  organization?: TestOrganization;
  roleAssignment?: TestRoleAssignment;
  roleCode?: Phase1RoleCode;
};

export type MockActiveContext = {
  user: TestUser;
  organization: TestOrganization;
  roleAssignment: TestRoleAssignment;
  activeContext: ActiveOrganizationRoleContext;
  actor: ActiveContextActor;
  attribution: ActiveContextAttribution;
};

export type MockExternalProvider = {
  name: string;
  calls: Array<{
    sequence: number;
    payload: unknown;
  }>;
  send(payload: unknown): Promise<{
    provider: string;
    status: "MOCK_ACCEPTED";
    providerMessageId: string;
  }>;
};

export type TestDatabaseStrategy = {
  kind: "POSTGRES_TEST_DATABASE";
  status: "AVAILABLE" | "UNCONFIGURED";
  requiredEnv: "TEST_DATABASE_URL";
  safeConnectionLabel: string;
};

export declare const TEST_CLOCK_ISO: "2026-06-10T10:00:00.000Z";
export declare const TEST_ORGANIZATIONS: Readonly<{
  breeder: TestOrganization;
  station: TestOrganization;
  platform: TestOrganization;
}>;

export function createTestUser(overrides?: Partial<TestUser>): Readonly<TestUser>;
export function createTestOrganization(
  overrides?: Partial<TestOrganization>,
): Readonly<TestOrganization>;
export function createTestRoleAssignment(
  overrides?: Partial<TestRoleAssignment>,
): Readonly<TestRoleAssignment>;
export function createMockActiveContext(
  input?: CreateMockActiveContextInput,
): Readonly<MockActiveContext>;
export function createMockExternalProvider(name?: string): MockExternalProvider;
export function createTestDatabaseStrategy(input?: {
  env?: Record<string, string | undefined>;
}): Readonly<TestDatabaseStrategy>;
