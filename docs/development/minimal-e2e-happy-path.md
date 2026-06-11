# MVP E2E Happy Path

Tickets 18.28 and 16.1 use a deterministic Node-based happy-path test at
`e2e/baseline.test.mjs`.

Run it with:

```bash
npm run test:e2e
```

The test uses in-memory repositories, mocked document metadata, the console
email provider and the manual logistics adapter, so it does not require a live
browser, database, object store, external email provider or carrier account.

## Coverage

The test covers:

- platform admin creates breeder and breeding-station organizations
- platform admin invites breeder and station users
- invitees accept onboarding links and receive role assignments
- station creates a stallion
- station creates an active semen listing
- breeder can see the active listing data through the catalog repository
- breeder creates a draft order
- breeder submits the order
- unauthorized cross-station receive is denied
- assigned station receives and confirms the order
- station creates a shipment through the logistics adapter
- station records a shipment tracking update
- station uploads mocked document metadata
- breeder views the order document
- key audit sources exist
- key proof events exist
- order, shipment and document notifications are triggered through the
  notification orchestration service

## Staging Demo Use

Use this test as the local pre-demo proof before staging handover:

1. Run `npm run test:e2e`.
2. Run `npm run db:seed` against the intended local or staging database.
3. Open the app with managed-auth test users or the approved staging auth
   setup.
4. Walk the breeder-to-station story: admin onboarding, station catalog,
   breeder order, station confirmation, shipment/document, proof timeline,
   audit log and notifications.

The hosted staging acceptance criterion remains blocked until CoriTech-owned
staging infrastructure, managed auth, email sender, object storage and
monitoring/provider secrets are configured outside the repository.

## Boundaries

This test does not add browser automation, real object storage, external email
delivery, carrier automation, payment processing, AI, blockchain/token logic,
federation automation, sensor ingestion or unrestricted buyer access.
