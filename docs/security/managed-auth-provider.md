# Managed Authentication Provider

## Purpose

Ticket 2.1 integrates managed authentication as a commodity infrastructure
boundary. CoriTech owns the internal user, organization and role model; the
selected provider owns credential collection, password storage, password reset,
email verification delivery, MFA challenge flows and hosted authentication UI.

## Phase 1 Provider Contract

The API contract in `api/domain/auth/managed-auth-provider.mjs` assumes an
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

## Environment Configuration

Ticket 0.3 variables are the source of configuration:

| Variable | Use |
| --- | --- |
| `AUTH_PROVIDER_DOMAIN` | Provider tenant host or issuer URL |
| `AUTH_PROVIDER_CLIENT_ID` | CoriTech application client ID |
| `AUTH_PROVIDER_CLIENT_SECRET` | CoriTech application client secret, read only from environment or secret manager |
| `APP_BASE_URL` | Browser return URLs after provider-hosted flows |
| `API_BASE_URL` | Auth callback URL origin |

Auth routes must not be enabled with placeholder provider values. Staging and
production values must come from a CoriTech-controlled secret manager or future
vault, not source control.

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

- The selected provider account is not named in this repository yet.
- Provider-specific token exchange and management API calls are represented as
  framework-neutral contracts; the concrete HTTP adapter belongs with the API
  runtime wiring.
- Ticket 2.2 RBAC enforcement is implemented as a framework-neutral middleware
  helper. The concrete HTTP adapter still needs to wire managed-auth sessions
  into that middleware at runtime.
