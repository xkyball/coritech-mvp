import type {
  ManagedAuthProviderConfig,
  ManagedAuthProviderIdentity,
} from "@coritech/domain/auth/managed-auth-provider.d.ts";

export interface GoogleAuthTokenResponse {
  idToken: string;
  accessToken: string;
  expiresIn: number | null;
  scope: string;
  tokenType: string;
}

export interface JwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

export interface GoogleIdTokenPayload {
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
  sub: string;
  email: string;
  email_verified: boolean;
  nonce?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  hd?: string;
}

export declare class GoogleAuthRuntimeError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}

export declare function isGoogleManagedAuthConfig(
  config: ManagedAuthProviderConfig,
): boolean;

export declare function exchangeGoogleAuthorizationCode(
  config: ManagedAuthProviderConfig,
  input: {
    code: string;
    clientSecret: string | undefined;
  },
  options?: { fetchFn?: typeof fetch },
): Promise<GoogleAuthTokenResponse>;

export declare function verifyGoogleIdToken(
  config: ManagedAuthProviderConfig,
  input: {
    idToken: string;
    nonce?: string | null;
    now?: Date;
  },
  options?: { fetchFn?: typeof fetch },
): Promise<ManagedAuthProviderIdentity>;
