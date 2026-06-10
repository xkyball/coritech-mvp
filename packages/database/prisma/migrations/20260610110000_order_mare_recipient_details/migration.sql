ALTER TABLE semen_orders
  ADD COLUMN mare_name text,
  ADD COLUMN mare_registration_reference text,
  ADD COLUMN mare_breed text,
  ADD COLUMN mare_owner_name text,
  ADD COLUMN intended_insemination_context text,
  ADD COLUMN vet_or_recipient_contact text,
  ADD CONSTRAINT semen_orders_mare_name_not_blank CHECK (
    mare_name IS NULL OR length(trim(mare_name)) > 0
  ),
  ADD CONSTRAINT semen_orders_mare_registration_reference_not_blank CHECK (
    mare_registration_reference IS NULL OR length(trim(mare_registration_reference)) > 0
  ),
  ADD CONSTRAINT semen_orders_mare_breed_not_blank CHECK (
    mare_breed IS NULL OR length(trim(mare_breed)) > 0
  ),
  ADD CONSTRAINT semen_orders_mare_owner_name_not_blank CHECK (
    mare_owner_name IS NULL OR length(trim(mare_owner_name)) > 0
  ),
  ADD CONSTRAINT semen_orders_intended_insemination_context_not_blank CHECK (
    intended_insemination_context IS NULL OR length(trim(intended_insemination_context)) > 0
  ),
  ADD CONSTRAINT semen_orders_vet_or_recipient_contact_not_blank CHECK (
    vet_or_recipient_contact IS NULL OR length(trim(vet_or_recipient_contact)) > 0
  );

COMMENT ON COLUMN semen_orders.mare_name IS
  'Mare name captured by the Phase 1.1 order mare/recipient details flow. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.mare_registration_reference IS
  'Mare registration or passport reference captured by the Phase 1.1 order mare/recipient details flow. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.mare_breed IS
  'Mare breed captured by the Phase 1.1 order mare/recipient details flow. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.mare_owner_name IS
  'Optional mare owner name captured for station processing context.';

COMMENT ON COLUMN semen_orders.intended_insemination_context IS
  'Optional intended insemination context captured for station processing context.';

COMMENT ON COLUMN semen_orders.vet_or_recipient_contact IS
  'Optional vet or recipient contact captured for station processing context.';
