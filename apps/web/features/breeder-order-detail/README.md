# Breeder Order Detail

Ticket 3.4 adds a breeder-scoped order detail view for Phase 1 semen ordering.

The feature accepts existing order, status-history, shipment, document and proof
event records and builds a read-only view model for a single breeder-owned
order. Access is intentionally narrow: the actor must have an active `BREEDER`
role for the order's breeder organization. Linked documents are filtered through
the domain `canViewDocument` rule and the page exposes document detail routes,
not object-storage paths or public file URLs.

The proof event section is display-only. It does not create proof events,
automate shipment federation, ingest sensors, add marketplace automation, add
AI claims, or add blockchain/token behavior.
