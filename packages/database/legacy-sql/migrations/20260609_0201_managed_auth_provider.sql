BEGIN;

COMMENT ON TABLE users IS
  'CoriTech user records linked to provider-managed authentication subjects. Ticket 2.1 delegates credential handling, password reset, email verification and admin MFA to a CoriTech-controlled managed auth provider.';

COMMENT ON COLUMN users.managed_auth_subject IS
  'Stable external subject from the CoriTech-controlled managed auth provider. Used to map verified auth identities to internal users.';

COMMIT;
