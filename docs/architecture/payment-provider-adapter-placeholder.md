# Payment Provider Adapter Placeholder

Ticket 10.2 adds a provider-neutral payment adapter boundary without adding
real payment processing.

## Adapter Contract

`packages/domain/src/payments/payment-provider-adapter.mjs` defines a
`PaymentProviderAdapter` shape with:

- `createPaymentReference`
- `updatePaymentReferenceStatus`
- `providerKind`
- `providerName`
- explicit flags that the adapter does not support real processing and does not
  store sensitive payment data

The contract works only with the Ticket 10.1 `PaymentReference` model. It does
not introduce checkout sessions, card tokens, bank credentials, provider
webhooks or settlement reconciliation.

## Phase 1 Implementations

`manual_reference` delegates to `PaymentReferenceService` and can create/update
manual payment references with append-only audit logging.

`provider_placeholder` exposes the future integration shape but throws
`PaymentProviderAdapterUnavailableError` when called. This prevents fake
provider behavior while keeping the extension point clear.

## No Card Data Rule

The adapter passes all writes through the payment reference service, which
rejects card numbers, CVC/CVV, card expiry, cardholder names, bank account
numbers, IBANs, raw provider payloads and raw provider responses.

Provider-specific secrets remain configuration concerns for future provider
tickets. No production provider account, checkout flow or vendor-owned payment
dependency is required by this placeholder.
