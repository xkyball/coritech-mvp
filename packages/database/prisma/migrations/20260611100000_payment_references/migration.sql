CREATE TYPE coritech_payment_reference_status AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED'
);

CREATE TABLE payment_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semen_order_id uuid NOT NULL REFERENCES semen_orders(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  breeder_organization_id uuid NOT NULL,
  breeding_station_organization_id uuid NOT NULL,
  provider_name text,
  provider_reference_id text,
  status coritech_payment_reference_status NOT NULL DEFAULT 'PENDING',
  amount numeric(12, 2),
  currency char(3),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT payment_references_order_number_required CHECK (length(trim(order_number)) > 0),
  CONSTRAINT payment_references_provider_name_not_blank CHECK (
    provider_name IS NULL OR length(trim(provider_name)) > 0
  ),
  CONSTRAINT payment_references_provider_reference_not_blank CHECK (
    provider_reference_id IS NULL OR length(trim(provider_reference_id)) > 0
  ),
  CONSTRAINT payment_references_provider_reference_required CHECK (
    status = 'NOT_REQUIRED'
    OR (provider_name IS NOT NULL AND provider_reference_id IS NOT NULL)
  ),
  CONSTRAINT payment_references_amount_non_negative CHECK (
    amount IS NULL OR amount >= 0
  ),
  CONSTRAINT payment_references_currency_iso_shape CHECK (
    currency IS NULL OR currency ~ '^[A-Z]{3}$'
  )
);

CREATE UNIQUE INDEX payment_references_order_provider_reference_unique
  ON payment_references (semen_order_id, provider_name, provider_reference_id);

CREATE INDEX payment_references_order_lookup
  ON payment_references (semen_order_id, updated_at DESC);

CREATE INDEX payment_references_status_lookup
  ON payment_references (status, updated_at DESC);

CREATE INDEX payment_references_provider_lookup
  ON payment_references (provider_name, provider_reference_id);

COMMENT ON TABLE payment_references IS
  'Reference-only external payment metadata linked to semen orders. CoriTech does not store card numbers, bank credentials or sensitive payment payloads.';

COMMENT ON COLUMN payment_references.provider_reference_id IS
  'External provider or manual payment reference identifier only; not a payment credential or card-data field.';
