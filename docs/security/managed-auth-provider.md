# Managed Authentication Provider

## Purpose

Ticket 2.1 integrates managed authentication as a commodity infrastructure
boundary. CoriTech owns the internal user, organization and role model; Google
hosted login owns credential collection, password storage, password reset,
email verification delivery, MFA challenge flows and hosted authentication UI.

## Phase 1 Provider Contract

The API contract in `packages/domain/src/auth/managed-auth-provider.mjs` assumes an
OIDC-compatible managed provider with CoriTech-controlled tenant ownership.

| Flow | CoriTech route | Provider responsibility | CoriTech responsibility |
| --- | --- | --- | --- |
| Sign-up | `GET /auth/signup` | Hosted sign-up, password handling and verification policy | Redirect to provider and map verified identity after callback |
| Login | `GET /auth/login` | Hosted login, credential validation and MFA challenge | Redirect to provider and create an internal session context |
| Callback | `GET /auth/callback` | Return verified OIDC identity claims after token exchange | Map provider subject to internal `users.managed_auth_subject` |
| Logout | `POST /auth/logout` | Provider logout and upstream session termination | Clear CoriTech session and redirect to provider logout |
| Password reset | `POST /auth/password-reset` | Reset token, email delivery and password update screen | Request provider-managed reset only |
| Email verification | `POST /auth/email-verification` | Verification email when supported by selected provider | Request provider-managed verification only |
| Session | `GET /auth/session` | Provider identity source of truth | Read CoriTech session context and active organization memberships |

## Web Application Routes

Ticket 18.03 adds the usable Next.js route surfaces around the provider
contract without adding local password logic:

| Route | Purpose | Notes |
| --- | --- | --- |
| `/login` | Public login entry point | Shows app context, accepts an email login hint and posts no password fields. |
| `/auth/login` | Provider redirect route | Creates short-lived state/nonce cookies and redirects to the hosted provider when configuration is valid. |
| `/auth/callback` | Provider callback route | Validates callback state, exchanges Google authorization codes, verifies Google ID tokens and redirects only to controlled same-origin paths. |
| `/logout` | Public logout confirmation page | Gives users a visible sign-out entry point. |
| `/auth/logout` | Logout action | Clears CoriTech session and auth-flow cookies and delegates upstream logout when provider configuration is valid. |
| `/logged-out` | Logout completion page | Confirms local session state was cleared. |
| `/password-reset` | Password reset entry page | Collects an email only so the provider-managed reset request can be prepared. |
| `/auth/password-reset` | Password reset action | Validates email and delegates reset responsibility to the provider contract; no CoriTech reset token is created. |
| `/auth/verification` | Email verification guidance | Documents provider-owned verification instructions when the provider requires email verification. |
| `/auth/error` | Auth error display | Presents readable, non-secret error states for failed or incomplete auth flows. |

Protected web routes under `/app`, `/breeder-dashboard` and
`/station-dashboard` now redirect unauthenticated requests to `/login` before
workspace content renders. The middleware only checks for the managed CoriTech
session cookie presence; it does not parse, log or expose session tokens.

For Google hosted login, `/auth/callback` exchanges the authorization code at
Google's token endpoint, validates the returned ID token with Google's JWKS,
maps the Google `sub` claim to `users.managed_auth_subject` using the
`google|<sub>` prefix, and then sets a signed CoriTech session cookie. Users
with no active CoriTech organization role land on `/app/no-role`; multi-role
users land on `/app/select-role` before choosing an active context.

## Environment Configuration

Ticket 0.3 variables are the source of configuration:

| Variable | Use |
| --- | --- |
| `AUTH_PROVIDER_DOMAIN` | Provider tenant host or issuer URL |
| `AUTH_PROVIDER_CLIENT_ID` | CoriTech application client ID |
| `AUTH_PROVIDER_CLIENT_SECRET` | CoriTech application client secret, read only from environment or secret manager |
| `AUTH_SESSION_SECRET` | Optional separate CoriTech session-cookie signing secret; if omitted, the OAuth client secret is used |
| `APP_BASE_URL` | Browser return URLs after provider-hosted flows |
| `API_BASE_URL` | Auth callback URL origin |

Auth routes must not be enabled with placeholder provider values. Staging and
production values must come from a CoriTech-controlled secret manager or future
vault, not source control.

## Google Hosted Login Setup

Use one Google OAuth Web client per CoriTech environment. The same variable
names are used in every environment; only values change:

| Environment | `AUTH_PROVIDER_DOMAIN` | Authorized redirect URI | Authorized JavaScript origin |
| --- | --- | --- | --- |
| Local | `https://accounts.google.com` | `http://localhost:3000/auth/callback` | `http://localhost:3000` |
| Staging | `https://accounts.google.com` | `${API_BASE_URL}/auth/callback` | `${APP_BASE_URL}` |
| Production | `https://accounts.google.com` | `${API_BASE_URL}/auth/callback` | `${APP_BASE_URL}` |

Required Google OAuth client settings:

- Application type: Web application.
- Scopes: `openid`, `profile`, `email`.
- Redirect URI must exactly match the deployed callback URL.
- The Google Cloud project, OAuth consent screen, OAuth clients, recovery
  contacts and production credentials must be CoriTech-controlled.
- Staging and production should set `AUTH_SESSION_SECRET` to a separate
  high-entropy secret in the deployment secret store.

## Internal User Mapping

The provider subject maps to `users.managed_auth_subject` and is the stable
external identity key. Email and display name are synchronized into the internal
`users` record so role assignments, proof events, documents and audit records
can reference CoriTech-owned user IDs without storing provider passwords.

Existing users must not be linked to a different provider subject. If a provider
email changes, the internal email may be updated after the provider identity has
been verified and uniqueness checks pass in the repository layer.

## Password Handling

CoriTech must not store password hashes, raw passwords, password reset tokens or
custom email verification tokens in Phase 1. Password reset and email
verification must use provider-managed flows. If the selected provider does not
support an email verification resend API, verification resend remains a provider
dashboard or support operation until a later approved ticket adds a
provider-specific adapter.

## Admin MFA

MFA is required for every `PLATFORM_ADMIN` account in staging and production.
The selected provider tenant must enforce MFA through provider policy, not
application-owned password prompts.

Minimum diligence evidence:

- Tenant MFA policy export or screenshot.
- List of `PLATFORM_ADMIN` provider accounts with MFA enrolled.
- Recovery factor and backup administrator evidence.
- Date of the last admin access review.

## Account Ownership

The managed auth tenant, application client, custom domain, recovery contacts
and production credentials must be controlled by CoriTech. Vendor personal,
freelancer or agency-owned auth tenants are not acceptable for production.

Ownership evidence is tracked in
`docs/vendor-ip/account-ownership-checklist.md`. Production use is blocked until
the managed auth provider row records CoriTech account ownership, primary admin,
backup admin and evidence location.

## Known Limitations

- Google account recovery and password reset stay inside Google. CoriTech does
  not create password reset tokens.
- Existing seed users use local managed-auth subjects. To let those users log in
  with Google, a platform admin or migration must link each user to the
  `google|<sub>` subject for the relevant Google account.
- Ticket 2.2 RBAC enforcement is implemented as a framework-neutral middleware
  helper. Route-level pages now resolve the managed session, but future API
  handlers still need to wire the same session source into RBAC checks.
