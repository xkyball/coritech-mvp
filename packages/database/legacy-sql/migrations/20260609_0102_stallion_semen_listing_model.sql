BEGIN;

CREATE TYPE coritech_stallion_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE coritech_semen_availability_status AS ENUM (
  'AVAILABLE',
  'LIMITED',
  'UNAVAILABLE'
);

CREATE TYPE coritech_semen_listing_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE UNIQUE INDEX organizations_id_organization_type_lookup
  ON organizations (id, organization_type);

CREATE TABLE stallions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breeding_station_organization_id uuid NOT NULL,
  breeding_station_organization_type coritech_organization_type NOT NULL DEFAULT 'BREEDING_STATION',
  name text NOT NULL,
  breed text NOT NULL,
  ueln text,
  microchip_number text,
  status coritech_stallion_status NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stallions_station_organization_type CHECK (
    breeding_station_organization_type = 'BREEDING_STATION'
  ),
  CONSTRAINT stallions_station_organization_fk FOREIGN KEY (
    breeding_station_organization_id,
    breeding_station_organization_type
  ) REFERENCES organizations (id, organization_type) ON DELETE RESTRICT,
  CONSTRAINT stallions_id_station_unique UNIQUE (
    id,
    breeding_station_organization_id
  ),
  CONSTRAINT stallions_name_required CHECK (length(trim(name)) > 0),
  CONSTRAINT stallions_breed_required CHECK (length(trim(breed)) > 0),
  CONSTRAINT stallions_ueln_not_blank CHECK (
    ueln IS NULL OR length(trim(ueln)) > 0
  ),
  CONSTRAINT stallions_microchip_number_not_blank CHECK (
    microchip_number IS NULL OR length(trim(microchip_number)) > 0
  )
);

CREATE TABLE semen_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stallion_id uuid NOT NULL,
  breeding_station_organization_id uuid NOT NULL,
  availability_status coritech_semen_availability_status NOT NULL DEFAULT 'AVAILABLE',
  listing_status coritech_semen_listing_status NOT NULL DEFAULT 'ACTIVE',
  terms_summary text,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT semen_listings_stallion_station_fk FOREIGN KEY (
    stallion_id,
    breeding_station_organization_id
  ) REFERENCES stallions (
    id,
    breeding_station_organization_id
  ) ON DELETE RESTRICT,
  CONSTRAINT semen_listings_terms_summary_not_blank CHECK (
    terms_summary IS NULL OR length(trim(terms_summary)) > 0
  )
);

CREATE INDEX stallions_station_lookup
  ON stallions (breeding_station_organization_id, status);

CREATE INDEX stallions_name_search
  ON stallions (lower(name));

CREATE INDEX stallions_breed_search
  ON stallions (lower(breed));

CREATE INDEX semen_listings_station_lookup
  ON semen_listings (
    breeding_station_organization_id,
    listing_status,
    availability_status
  );

CREATE INDEX semen_listings_stallion_lookup
  ON semen_listings (stallion_id, listing_status);

CREATE INDEX semen_listings_active_search
  ON semen_listings (
    listing_status,
    availability_status,
    breeding_station_organization_id
  );

COMMENT ON TABLE stallions IS
  'Station-owned stallion catalog records for the Phase 1 semen-ordering MVP wedge.';

COMMENT ON COLUMN stallions.breeding_station_organization_id IS
  'Owning breeding station organization. Application writes require owning BREEDING_STATION role context or PLATFORM_ADMIN.';

COMMENT ON COLUMN stallions.ueln IS
  'Optional UELN identifier when available; not all Phase 1 records are expected to have one.';

COMMENT ON COLUMN stallions.microchip_number IS
  'Optional chip identifier when available; not all Phase 1 records are expected to have one.';

COMMENT ON TABLE semen_listings IS
  'Semen listing records linked to a stallion and owning breeding station. Listing writes must emit the SEMEN_LISTING_CHANGE audit hook until Ticket 1.8 creates the AuditLog table.';

COMMENT ON COLUMN semen_listings.availability_status IS
  'Operational availability state used for Phase 1 filtering and orderability checks.';

COMMENT ON COLUMN semen_listings.listing_status IS
  'ACTIVE listings can be shown to breeders; INACTIVE listings must not be orderable.';

COMMENT ON COLUMN semen_listings.terms_summary IS
  'Short operational terms summary only; this is not full marketplace automation or payment processing.';

COMMIT;
