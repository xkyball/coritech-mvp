# Admin Amendment Workflow

## Purpose

The Platform Admin amendment workflow allows controlled corrections while
preserving the original operational or proof-relevant record state. It supports
Ticket 8.3 without creating direct edit paths for proof-critical fields.

## Surface

- `/app/admin/amendments` - read-only list and target filter for recorded
  amendments.
- `/app/admin/amendments/new` - Platform Admin correction form.
- `/app/admin/orders/[orderId]` - order support detail links selected orders
  into the amendment form.

All amendment routes require an active `PLATFORM_ADMIN` context.

## Workflow

1. The admin selects a supported target type and target ID.
2. The admin optionally selects a target field.
3. The admin enters an amended value and a mandatory correction reason.
4. The repository loads the current target snapshot at submission time.
5. The domain amendment service stores the original value from that snapshot,
   the amended value, the reason and target references.
6. The domain audit hook creates a `CREATE_AMENDMENT` audit entry.

The target record is not updated by the workflow. Any later applied correction
must continue through the amendment process rather than silent overwrites.

## Supported Targets

The Phase 1 target set is the domain amendment target set:

- `SemenOrder`
- `OrderStatusHistory`
- `Shipment`
- `ShipmentTrackingEvent`
- `Document`
- `EvidenceAttachment`
- `ProofEvent`

Order and shipment context is attached only when the target snapshot contains
the complete context required by the domain proof-link validation. The target
snapshot itself is still preserved even when a history row does not contain
complete order context.

## Audit And Proof Behavior

The workflow persists amendment records through the existing domain amendment
service. Audit entries are produced by the existing audit hook path with
previous values set to the captured original value and new values set to the
amended value.

The current admin UI records the amendment and audit log. It does not add
blockchain, token logic, AI review, public document links or unrestricted buyer
access.
