ALTER TABLE notification_logs
  ADD COLUMN provider_message_id text;

CREATE INDEX notification_logs_provider_message_lookup
  ON notification_logs (provider_message_id)
  WHERE provider_message_id IS NOT NULL;
