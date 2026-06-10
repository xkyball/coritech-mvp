ALTER TABLE "shipments"
  ADD COLUMN "delivered_at" TIMESTAMPTZ(6),
  ADD COLUMN "confirmed_received_at" TIMESTAMPTZ(6),
  ADD COLUMN "confirmed_by_user_id" UUID,
  ADD COLUMN "confirmation_source" TEXT;
