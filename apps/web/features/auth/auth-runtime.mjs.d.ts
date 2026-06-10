import type {
  ManagedAuthLogoutInput,
  ManagedAuthPasswordResetInput,
  ManagedAuthProviderActionRequest,
  ManagedAuthProviderConfig,
  ManagedAuthRedirectInput,
} from "@coritech/domain/auth/managed-auth-provider.d.ts";

export type ManagedAuthRuntime =
  | {
      enabled: true;
      config: ManagedAuthProviderConfig;
      issues: string[];
    }
  | {
      enabled: false;
      config: null;
      issues: string[];
    };

export declare function getManagedAuthRuntime(
  source?: Record<string, string | undefined> | NodeJS.ProcessEnv,
): ManagedAuthRuntime;
export declare function buildRuntimeLoginUrl(
  config: ManagedAuthProviderConfig,
  input: Omit<ManagedAuthRedirectInput, "flow">,
): string;
export declare function buildRuntimeLogoutUrl(
  config: ManagedAuthProviderConfig,
  input: ManagedAuthLogoutInput,
): string;
export declare function prepareRuntimePasswordResetRequest(
  config: ManagedAuthProviderConfig,
  input: ManagedAuthPasswordResetInput,
): ManagedAuthProviderActionRequest;
