# External Systems Register

## Purpose

This register tracks external systems, ownership, data exchanged and diligence
status for Phase 1.

## Register

| System | Phase 1 use | Data exchanged | Account ownership | Status |
| --- | --- | --- | --- | --- |
| Source-control platform | Repository, review and ownership evidence | Code and documentation | CoriTech-controlled required | `[PENDING_CONFIRMATION]` |
| Google hosted auth | User authentication and identity evidence through Ticket 2.1 hosted auth contract | Account data, auth events, Google OIDC subject and verified email | CoriTech-controlled Google Cloud project required | Google OIDC runtime implemented; CoriTech-controlled account evidence pending |
| Database provider | Operational and proof records | Core data model records | CoriTech-controlled required | `[PENDING_VENDOR_SELECTION]` |
| Object storage provider | Evidence documents | Uploaded documents and metadata | CoriTech-controlled required | Local MinIO foundation added; production provider selection and account evidence pending |
| Email provider | Outbound notification delivery through the Ticket 9.1 provider adapter | Email address, rendered notification content, template context and delivery metadata | CoriTech-controlled provider account, sender domain/address and API key required | Adapter implemented; provider/vendor selection and account evidence pending |
| Payment provider | Future payment-provider integration through the Ticket 10.2 adapter placeholder | Payment reference status, provider name/reference id, amount and currency only | No production payment account required in Phase 1; future provider tickets must document account ownership and credentials | Placeholder only; manual/reference adapter writes `PaymentReference` records and no card or bank data |
| Logistics provider | Future carrier integration through the Ticket 5.2 logistics adapter placeholder | Shipment provider name, tracking id, tracking URL, provider status, source event id and event metadata | No production carrier account required in Phase 1; future provider tickets must document account ownership and credentials | Placeholder only; manual adapter writes through `ShipmentService` and external adapter fails closed |
| Hosting provider | Application and API deployment | Application runtime and logs | CoriTech-controlled required | `[PENDING_VENDOR_SELECTION]` |
| Logistics provider | Shipment reference fields and future normalized tracking source | Shipment references and milestones when later approved | `[PENDING_PROVIDER_MODEL]` | `[STRUCTURAL_REFERENCE_ONLY]` |
| Payment provider | Future payment processing or reference support | Payment references only in Phase 1 | `[PENDING_PROVIDER_MODEL]` | `[PENDING_FUTURE_TICKET]` |
| Federation/studbook systems | Future full federation automation | None in Phase 1 | `[NOT_IN_PHASE_1]` | Delayed |
| AI service | Future insights or automation | None in Phase 1 | `[NOT_IN_PHASE_1]` | Delayed |
| Blockchain/token platform | Future tokenized proof, if ever approved | None in Phase 1 | `[NOT_IN_PHASE_1]` | Delayed |
| Sensor/wearable platform | Future device ingestion, if approved | None in Phase 1 | `[NOT_IN_PHASE_1]` | Delayed |

## Vendor Diligence Fields

Each selected system must eventually document:

- Legal vendor name.
- Contract owner.
- CoriTech account owner.
- Backup administrator.
- Data processing agreement status.
- Data export path.
- Decommission or transfer path.
- Security evidence location.

## Control Rule

Vendor memory is not a control. Evidence must be documented, exportable and
available to CoriTech.
