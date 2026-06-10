import {
  Badge,
  Button,
  ButtonLink,
  ErrorState,
  PageHeader,
  ValidationErrorList,
} from "../../components/ui";
import {
  createAccessDeniedViewModel,
  createNotFoundViewModel,
  createUnauthenticatedViewModel,
  createUnexpectedErrorViewModel,
  type ErrorSurfaceModel,
  type ValidationIssue,
} from "./error-handling.mjs";

export function ErrorSurface({
  action,
  model,
}: Readonly<{
  action?: React.ReactNode;
  model: ErrorSurfaceModel;
}>) {
  return (
    <main className="ct-main" aria-labelledby="error-surface-title">
      <PageHeader
        actions={action ?? <ButtonLink href={model.actionHref}>{model.actionLabel}</ButtonLink>}
        eyebrow={model.eyebrow}
        meta={<Badge tone="danger">{model.badge}</Badge>}
        subtitle={model.message}
        title={model.title}
      />
    </main>
  );
}

export function AccessDeniedSurface({
  reason,
  returnHref,
}: Readonly<{
  reason?: string;
  returnHref?: string;
}>) {
  return <ErrorSurface model={createAccessDeniedViewModel({ reason, returnHref })} />;
}

export function UnauthenticatedSurface() {
  return <ErrorSurface model={createUnauthenticatedViewModel()} />;
}

export function NotFoundSurface({
  resourceLabel,
  returnHref,
}: Readonly<{
  resourceLabel?: string;
  returnHref?: string;
}>) {
  return <ErrorSurface model={createNotFoundViewModel({ resourceLabel, returnHref })} />;
}

export function GlobalErrorSurface({
  reset,
}: Readonly<{
  reset?: () => void;
}>) {
  const model = createUnexpectedErrorViewModel();

  return (
    <main className="ct-main" aria-labelledby="global-error-title">
      <ErrorState message={model.message} title={model.title} />
      <div className="ct-state__actions">
        {reset ? (
          <Button onClick={reset} type="button">
            Try again
          </Button>
        ) : null}
        <ButtonLink href={model.actionHref} variant="secondary">
          {model.actionLabel}
        </ButtonLink>
      </div>
    </main>
  );
}

export function ValidationErrorDisplay({
  issues,
}: Readonly<{
  issues: readonly ValidationIssue[];
}>) {
  return <ValidationErrorList issues={issues} />;
}
