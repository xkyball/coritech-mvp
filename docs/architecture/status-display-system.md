# Status Display System

## Purpose

Ticket 18.33 centralizes user-facing status language for order, shipment,
payment-reference and verification states.

The registry lives in `apps/web/features/status-display` and is display-only.
Workflow services remain the source of truth for allowed transitions and
permission checks.

## Status Families

| Family | Source | Display responsibility |
| --- | --- | --- |
| Order | `SEMEN_ORDER_STATUSES` | Labels, descriptions, badge tones and role-specific next-action hints |
| Shipment | `SHIPMENT_STATUSES` | Labels, descriptions, badge tones and role-specific next-action hints |
| Payment reference | Ticket 10.1 status vocabulary | Labels, descriptions and no-card-data language before the later model ticket |
| Verification level | Active Phase 1 verification levels | Plain-language descriptions that avoid overclaiming proof strength |

## UI Components

Shared UI exports now include:

- `OrderStatusBadge`
- `ShipmentStatusBadge`
- `PaymentStatusBadge`
- `VerificationLevelBadge`
- `StatusDescription`

`StatusBadge` remains available for generic statuses and now resolves labels and
tones from the same registry when a status kind is supplied.

## Next-Action Hints

Role-specific hints are guidance text only. They do not authorize workflow
commands and must not replace server-side role, organization or object checks.

Examples:

- A breeder seeing a `DRAFT` order is told to review and submit the draft.
- A breeding station seeing a `RECEIVED` order is told to confirm or reject it.
- A breeder seeing a `DELIVERED` shipment is told to confirm receipt where
  applicable.

## Verification Wording

Verification labels explain how the record was produced:

- `SELF_REPORTED`: participant-entered workflow fact.
- `SYSTEM_RECORDED`: application-captured workflow event.
- `STATION_CONFIRMED`: fact confirmed by the assigned breeding station.
- `ADMIN_REVIEWED`: platform-admin review or correction evidence.

These labels do not imply blockchain, federation, veterinary signature or
transaction-ready verification.

## Payment Boundary

Payment reference statuses describe the Ticket 10.1 reference-only model. They
represent manual or external payment evidence and do not add card processing,
bank credentials, checkout or sensitive payment data storage. Ticket 18.17 uses
the shared payment badge on order detail surfaces for breeder read-only views
and station/admin manual reference maintenance.
