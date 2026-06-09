ALTER TABLE semen_orders
  ADD COLUMN requested_delivery_date date,
  ADD COLUMN shipping_contact_name text,
  ADD COLUMN shipping_contact_phone text,
  ADD COLUMN shipping_address_line_1 text,
  ADD COLUMN shipping_address_line_2 text,
  ADD COLUMN shipping_city text,
  ADD COLUMN shipping_region text,
  ADD COLUMN shipping_postal_code text,
  ADD COLUMN shipping_country text,
  ADD COLUMN special_instructions text,
  ADD CONSTRAINT semen_orders_requested_delivery_date_reasonable CHECK (
    requested_delivery_date IS NULL OR requested_delivery_date >= DATE '2020-01-01'
  ),
  ADD CONSTRAINT semen_orders_shipping_contact_name_not_blank CHECK (
    shipping_contact_name IS NULL OR length(trim(shipping_contact_name)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_contact_phone_not_blank CHECK (
    shipping_contact_phone IS NULL OR length(trim(shipping_contact_phone)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_address_line_1_not_blank CHECK (
    shipping_address_line_1 IS NULL OR length(trim(shipping_address_line_1)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_address_line_2_not_blank CHECK (
    shipping_address_line_2 IS NULL OR length(trim(shipping_address_line_2)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_city_not_blank CHECK (
    shipping_city IS NULL OR length(trim(shipping_city)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_region_not_blank CHECK (
    shipping_region IS NULL OR length(trim(shipping_region)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_postal_code_not_blank CHECK (
    shipping_postal_code IS NULL OR length(trim(shipping_postal_code)) > 0
  ),
  ADD CONSTRAINT semen_orders_shipping_country_not_blank CHECK (
    shipping_country IS NULL OR length(trim(shipping_country)) > 0
  ),
  ADD CONSTRAINT semen_orders_special_instructions_not_blank CHECK (
    special_instructions IS NULL OR length(trim(special_instructions)) > 0
  );

COMMENT ON COLUMN semen_orders.requested_delivery_date IS
  'Breeder-requested delivery date captured by the Phase 1 order creation flow. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_contact_name IS
  'Shipping contact name captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_contact_phone IS
  'Shipping contact phone captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_address_line_1 IS
  'Primary shipping address line captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_address_line_2 IS
  'Optional secondary shipping address line captured at order creation.';

COMMENT ON COLUMN semen_orders.shipping_city IS
  'Shipping city captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_region IS
  'Optional shipping region captured at order creation.';

COMMENT ON COLUMN semen_orders.shipping_postal_code IS
  'Shipping postal code captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.shipping_country IS
  'Shipping country captured at order creation. Required by application validation before SUBMITTED status.';

COMMENT ON COLUMN semen_orders.special_instructions IS
  'Optional breeder instructions captured at order creation; no automated fulfillment behavior is attached in Phase 1.';
