import {
  Alert,
  Button,
  Card,
  DetailList,
  Field,
  Input,
  Notice,
  PaymentStatusBadge,
  SectionHeader,
  Select,
  StatusDescription,
  Textarea,
} from "../../components/ui";
import type {
  PaymentReferencePanelViewModel,
} from "./payment-reference-ui.d.ts";

type PaymentReferencePanelSurface = "card" | "section";

export function PaymentReferencePanel({
  action,
  surface = "card",
  viewModel,
}: Readonly<{
  action?: (formData: FormData) => Promise<void>;
  surface?: PaymentReferencePanelSurface;
  viewModel: PaymentReferencePanelViewModel;
}>) {
  const content = (
    <>
      <SectionHeader
        actions={<PaymentStatusBadge value={viewModel.status} />}
        id="payment-reference-heading"
        subtitle={viewModel.summary}
        title={viewModel.title}
      />
      {viewModel.feedback ? (
        <Alert title={viewModel.feedback.title} tone={viewModel.feedback.tone}>
          <p>{viewModel.feedback.message}</p>
        </Alert>
      ) : null}
      <DetailList
        items={[
          { term: "Status", value: viewModel.statusLabel },
          ...viewModel.displayRows.map((row) => ({
            term: row.label,
            value: row.value,
          })),
        ]}
      />
      <StatusDescription kind="payment" status={viewModel.status} />
      <Notice title="Reference-only payment flow" tone="info">
        <p>{viewModel.referenceOnlyNotice}</p>
        <p>{viewModel.settlementNotice}</p>
      </Notice>
      {viewModel.maintenance.form && action ? (
        <ManualPaymentReferenceForm
          action={action}
          form={viewModel.maintenance.form}
        />
      ) : viewModel.maintenance.deniedReason ? (
        <p>{viewModel.maintenance.deniedReason}</p>
      ) : null}
    </>
  );

  if (surface === "section") {
    return <div className="ct-section-divider">{content}</div>;
  }

  return (
    <Card aria-labelledby="payment-reference-heading">
      {content}
    </Card>
  );
}

function ManualPaymentReferenceForm({
  action,
  form,
}: Readonly<{
  action: (formData: FormData) => Promise<void>;
  form: PaymentReferencePanelViewModel["maintenance"]["form"];
}>) {
  if (!form) {
    return null;
  }

  return (
    <form action={action} className="ct-form-grid">
      <input name="orderId" type="hidden" value={form.orderId} />
      <input name="paymentReferenceId" type="hidden" value={form.paymentReferenceId ?? ""} />
      <input name="returnTo" type="hidden" value={form.returnTo ?? ""} />
      <Field htmlFor="payment-reference-status" label="Payment status">
        <Select
          defaultValue={form.values.status}
          id="payment-reference-status"
          name="status"
          required
        >
          {form.statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        hint="Required unless the status is Not required."
        htmlFor="payment-provider-name"
        label="Provider"
      >
        <Input
          defaultValue={form.values.providerName}
          id="payment-provider-name"
          maxLength={80}
          name="providerName"
          placeholder="Manual reference"
        />
      </Field>
      <Field
        hint="Reference only; do not enter card, account or bank credential data."
        htmlFor="payment-provider-reference"
        label="Provider reference"
      >
        <Input
          defaultValue={form.values.providerReferenceId}
          id="payment-provider-reference"
          maxLength={120}
          name="providerReferenceId"
          placeholder="INV-1001"
        />
      </Field>
      <Field htmlFor="payment-reference-amount" label="Amount">
        <Input
          defaultValue={form.values.amount}
          id="payment-reference-amount"
          min="0"
          name="amount"
          step="0.01"
          type="number"
        />
      </Field>
      <Field htmlFor="payment-reference-currency" label="Currency">
        <Input
          defaultValue={form.values.currency}
          id="payment-reference-currency"
          maxLength={3}
          name="currency"
          pattern="[A-Za-z]{3}"
          placeholder="ZAR"
        />
      </Field>
      <label className="ct-field" htmlFor="payment-reference-reason">
        <span>Audit reason</span>
        <Textarea
          defaultValue={form.values.reason}
          id="payment-reference-reason"
          name="reason"
          placeholder="Manual reference update reason"
          rows={3}
        />
      </label>
      <Button type="submit" variant="secondary">
        {form.submitLabel}
      </Button>
    </form>
  );
}
