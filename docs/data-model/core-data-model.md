# Core Data Model

## Purpose

This is a starter model for Phase 1 due diligence. It is conceptual only and
does not create database tables, migrations or application code.

## Core Entities

| Entity | Phase 1 role | Key relationships |
| --- | --- | --- |
| User | Authenticated person using CoriTech | Belongs to one or more organizations through roles |
| Organization | Breeder, breeding station, CoriTech admin entity or future partner | Owns users, listings, orders or review actions |
| Role | Permission group scoped to organization context | Grants workflow and evidence access |
| Stallion | Horse record used for semen listing context | Owned or managed by a breeding station |
| SemenListing | Offer record for available semen | Linked to stallion and breeding station |
| SemenOrder | Operational order between breeder and breeding station | Links breeder, station, listing, shipment and evidence |
| OrderStatusHistory | Ordered record of order state changes | Linked to semen order and actor |
| Shipment | Delivery record for semen order fulfillment | Linked to order and tracking events |
| ShipmentTrackingEvent | Milestone, carrier update or manual tracking note | Linked to shipment and actor/source |
| EvidenceDocument | Metadata for uploaded proof documents | Linked to order, shipment or proof event |
| ProofEvent | Workflow-generated proof record | Links trigger, documentation, signature, verification level and audit trail |
| VerificationLevel | Reviewable trust level applied to proof events | Used by proof event and reporting surfaces |
| AuditLog | Immutable operational audit entry | Links actor, action, target object and timestamp |
| AccessPermission | Controlled document or workflow access grant | Links subject, resource and permission |
| Amendment | Controlled correction record | Links original record, reason, approver and audit evidence |
| PaymentReference | Non-processing payment reference | Links order to external payment evidence when applicable |

## Data Ownership Principle

Operational and proof data must remain under CoriTech-controlled accounts or
contractually transferable systems. Vendor memory is not an acceptable system of
record.

## Open Placeholders

| Area | Placeholder |
| --- | --- |
| Database provider | `[PENDING_VENDOR_SELECTION]` |
| Canonical IDs | `[PENDING_ARCHITECTURE_DECISION]` |
| Required document types | `[PENDING_DOMAIN_DECISION]` |
| Retention periods | `[PENDING_LEGAL_DECISION]` |
| Data residency requirements | `[PENDING_LEGAL_DECISION]` |
