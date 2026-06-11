import type { ReactNode } from "react";
import {
  Alert,
  Button,
  Card,
  Field,
  SectionHeader,
  Select,
  Textarea,
} from "../../components/ui";
import type { SupportRequestFormViewModel } from "./support-requests.d.ts";

type SupportRequestSurface = "card" | "section";

export function SupportRequestFormPanel({
  action,
  secondaryAction,
  surface = "card",
  viewModel,
}: Readonly<{
  action?: (formData: FormData) => Promise<void>;
  secondaryAction?: ReactNode;
  surface?: SupportRequestSurface;
  viewModel: SupportRequestFormViewModel;
}>) {
  const headingId = `support-request-heading-${viewModel.orderId}`;
  const form = (
    <>
      <SectionHeader
        actions={secondaryAction}
        id={headingId}
        subtitle={`Order ${viewModel.orderNumber}`}
        title={viewModel.title}
      />
      {viewModel.confirmation ? (
        <Alert title="Support request queued" tone="success">
          <p>{viewModel.confirmation}</p>
        </Alert>
      ) : null}
      {viewModel.canSubmit && action ? (
        <form action={action} className="ct-form-grid">
          <input name="orderId" type="hidden" value={viewModel.orderId} />
          <Field htmlFor={`support-request-category-${viewModel.orderId}`} label="Category">
            <Select
              id={`support-request-category-${viewModel.orderId}`}
              name="category"
              required
            >
              {viewModel.categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="ct-field" htmlFor={`support-request-message-${viewModel.orderId}`}>
            <span>Message</span>
            <Textarea
              id={`support-request-message-${viewModel.orderId}`}
              name="message"
              placeholder="Describe what the CoriTech support team should review"
              required
              rows={4}
            />
          </label>
          <Button type="submit" variant="secondary">
            Submit support request
          </Button>
        </form>
      ) : null}
    </>
  );

  if (surface === "section") {
    return <div className="ct-section-divider">{form}</div>;
  }

  return (
    <Card aria-labelledby={headingId}>
      {form}
    </Card>
  );
}
