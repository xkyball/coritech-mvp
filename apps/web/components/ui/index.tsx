import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes as ReactInputHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  RefObject,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import {
  formatStatusDisplayLabel,
  getStatusBadgeTone,
  getStatusDescription,
  getStatusNextActionHint,
} from "../../features/status-display/status-display-registry.mjs";
import type {
  StatusDisplayKind,
  StatusDisplayRoleCode,
} from "../../features/status-display/status-display.d.ts";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface DashboardNavItem {
  href: string;
  label: string;
}

export interface DashboardContextOption {
  key: string;
  label: string;
  organizationName: string;
  roleLabel: string;
}

export interface DetailListItem {
  term: string;
  value: ReactNode;
}

export interface ProofEventListItem {
  id?: string | null;
  eventType: unknown;
  source?: unknown;
  lifecycleStage?: unknown;
  verificationLevel: unknown;
  status: unknown;
  actorRoleCode?: unknown;
  actorOrganizationId?: string | null;
  organizationLabel?: string | null;
  linkedObjectLabel?: string | null;
  documentationCount?: number | null;
  occurredAt: string;
  auditStatus?: unknown;
}

export interface ValidationIssueDisplay {
  field?: string | null;
  message: string;
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardShell({
  activeHref,
  activeContextKey,
  children,
  contextOptions,
  contextSwitchAction,
  navigation,
  organizationName,
  roleLabel,
  userLabel = "Demo workspace",
}: Readonly<{
  activeHref?: string;
  children: ReactNode;
  activeContextKey?: string;
  contextOptions?: readonly DashboardContextOption[];
  contextSwitchAction?: string;
  navigation: readonly DashboardNavItem[];
  organizationName?: string;
  roleLabel: string;
  userLabel?: string;
}>) {
  const hasContextSwitcher = Boolean(contextOptions && contextOptions.length > 1);

  return (
    <div className="ct-shell">
      <aside className="ct-sidebar" aria-label="Workspace navigation">
        <div className="ct-wordmark" aria-label="CoriTech">
          <span>CoriTech</span>
          <small>Verified Equine Data Space</small>
        </div>
        <nav className="ct-sidebar__nav" aria-label={`${roleLabel} navigation`}>
          {navigation.map((item) => (
            <a
              aria-current={item.href === activeHref ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="ct-shell__body">
        <header className="ct-topbar">
          <div>
            <span className="ct-topbar__label">Active organization</span>
            <strong>{organizationName ?? "CoriTech workspace"}</strong>
          </div>
          <div className="ct-topbar__context" aria-label="Session context">
            {hasContextSwitcher ? (
              <form
                action={contextSwitchAction ?? "/app/context/switch"}
                className="ct-context-switcher"
                method="post"
              >
                <label htmlFor="activeContextKey">Active context</label>
                <select
                  defaultValue={activeContextKey}
                  id="activeContextKey"
                  name="activeContextKey"
                >
                  {contextOptions?.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="secondary">
                  Switch
                </Button>
              </form>
            ) : (
              <Badge tone="info">{roleLabel}</Badge>
            )}
            <span>{userLabel}</span>
            <form action="/auth/logout" className="ct-topbar__logout" method="post">
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="ct-main">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  actions,
  breadcrumb,
  eyebrow,
  meta,
  subtitle,
  title,
}: Readonly<{
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  subtitle?: string;
  title: string;
}>) {
  return (
    <header className="ct-page-header">
      {breadcrumb ? <div className="ct-page-header__breadcrumb">{breadcrumb}</div> : null}
      <div className="ct-page-header__content">
        <div>
          {eyebrow ? <p className="ct-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {meta ? <div className="ct-page-header__meta">{meta}</div> : null}
        </div>
        {actions ? <ActionBar>{actions}</ActionBar> : null}
      </div>
    </header>
  );
}

export function Breadcrumbs({
  items,
}: Readonly<{
  items: ReadonlyArray<{ href?: string; label: string }>;
}>) {
  return (
    <nav aria-label="Breadcrumb" className="ct-breadcrumbs">
      <ol>
        {items.map((item) => (
          <li key={`${item.href ?? "current"}:${item.label}`}>
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeader({
  actions,
  count,
  id,
  subtitle,
  title,
}: Readonly<{
  actions?: ReactNode;
  count?: string;
  id: string;
  subtitle?: string;
  title: string;
}>) {
  return (
    <div className="ct-section-header">
      <div>
        <h2 id={id}>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="ct-section-header__meta">
        {count ? <span>{count}</span> : null}
        {actions}
      </div>
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: Readonly<HTMLAttributes<HTMLElement> & { children: ReactNode }>) {
  return (
    <section className={cx("ct-card", className)} {...props}>
      {children}
    </section>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return <button className={cx("ct-button", `ct-button--${variant}`, className)} {...props} />;
}

export function ButtonLink({
  className,
  variant = "secondary",
  ...props
}: Readonly<AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }>) {
  return <a className={cx("ct-button", `ct-button--${variant}`, className)} {...props} />;
}

export function IconButton({
  className,
  label,
  variant = "secondary",
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: ButtonVariant;
}>) {
  return (
    <button
      aria-label={label}
      className={cx("ct-icon-button", `ct-button--${variant}`, className)}
      title={label}
      {...props}
    />
  );
}

export function ActionBar({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={cx("ct-action-bar", className)}>{children}</div>;
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: Readonly<{
  children: ReactNode;
  className?: string;
  tone?: Tone;
}>) {
  return <span className={cx("ct-badge", `ct-badge--${tone}`, className)}>{children}</span>;
}

export function StatusBadge({
  kind,
  label,
  value,
}: Readonly<{
  kind?: StatusDisplayKind;
  label?: string;
  value: unknown;
}>) {
  const formatted = label ?? formatStatusLabel(value, kind);
  const tone = statusTone(value, kind);

  return (
    <span className={cx("ct-badge", "ct-badge--status", `ct-badge--${tone}`)}>
      <span className="ct-badge__dot" aria-hidden="true" />
      {formatted}
    </span>
  );
}

export function OrderStatusBadge({ value }: Readonly<{ value: unknown }>) {
  return <StatusBadge kind="order" value={value} />;
}

export function ShipmentStatusBadge({ value }: Readonly<{ value: unknown }>) {
  return <StatusBadge kind="shipment" value={value} />;
}

export function PaymentStatusBadge({ value }: Readonly<{ value: unknown }>) {
  return <StatusBadge kind="payment" value={value} />;
}

export function VerificationLevelBadge({ value }: Readonly<{ value: unknown }>) {
  return <StatusBadge kind="verification" value={value} />;
}

export function VerificationBadge({
  value,
}: Readonly<{
  value: unknown;
}>) {
  return <VerificationLevelBadge value={value} />;
}

export function StatusDescription({
  kind,
  roleCode,
  status,
}: Readonly<{
  kind: StatusDisplayKind;
  roleCode?: StatusDisplayRoleCode | string | null;
  status: unknown;
}>) {
  const description = getStatusDescription(status, kind);
  const nextAction = roleCode
    ? getStatusNextActionHint({ kind, status, roleCode })
    : null;

  if (!description && !nextAction) {
    return null;
  }

  return (
    <div className="ct-status-description">
      {description ? <p>{description}</p> : null}
      {nextAction ? <p>{nextAction}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  meta,
  value,
}: Readonly<{
  label: string;
  meta?: string;
  value: ReactNode;
}>) {
  return (
    <article className="ct-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <p>{meta}</p> : null}
    </article>
  );
}

export function DataPanel({
  children,
  label,
  value,
}: Readonly<{
  children?: ReactNode;
  label: string;
  value: ReactNode;
}>) {
  return (
    <div className="ct-data-panel">
      <span>{label}</span>
      <strong>{value}</strong>
      {children}
    </div>
  );
}

export function DetailList({
  className,
  items,
}: Readonly<{
  className?: string;
  items: readonly DetailListItem[];
}>) {
  return (
    <dl className={cx("ct-description-list", "ct-description-list--grid", className)}>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Field({
  children,
  className,
  hint,
  htmlFor,
  label,
}: Readonly<{
  children: ReactNode;
  className?: string;
  hint?: string;
  htmlFor: string;
  label: string;
}>) {
  return (
    <div className={cx("ct-field", className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p>{hint}</p> : null}
    </div>
  );
}

export function SearchField({
  defaultValue = "",
  hint,
  id,
  label = "Search",
  name = "query",
  placeholder = "Search",
}: Readonly<{
  defaultValue?: string;
  hint?: string;
  id: string;
  label?: string;
  name?: string;
  placeholder?: string;
}>) {
  return (
    <Field hint={hint} htmlFor={id} label={label}>
      <Input
        defaultValue={defaultValue}
        id={id}
        name={name}
        placeholder={placeholder}
        type="search"
      />
    </Field>
  );
}

export function Input({
  className,
  ...props
}: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return <input className={cx("ct-input", className)} {...props} />;
}

export function DateInput({
  className,
  ...props
}: Readonly<Omit<InputHTMLAttributes<HTMLInputElement>, "type">>) {
  return <input className={cx("ct-input", className)} type="date" {...props} />;
}

export function Select({
  className,
  ...props
}: Readonly<SelectHTMLAttributes<HTMLSelectElement>>) {
  return <select className={cx("ct-select", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  return <textarea className={cx("ct-textarea", className)} {...props} />;
}

export function FormError({
  children,
  id,
}: Readonly<{
  children: ReactNode;
  id?: string;
}>) {
  return (
    <p className="ct-form-error" id={id} role="alert">
      {children}
    </p>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: Readonly<Omit<ReactInputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
}>) {
  return (
    <label className={cx("ct-check", className)}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Toggle({
  className,
  label,
  ...props
}: Readonly<Omit<ReactInputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
}>) {
  return (
    <label className={cx("ct-toggle", className)}>
      <input type="checkbox" role="switch" {...props} />
      <span aria-hidden="true" />
      <strong>{label}</strong>
    </label>
  );
}

export function Table({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div className="ct-table-wrap">
      <table className={cx("ct-table", className)}>{children}</table>
    </div>
  );
}

export function PaginationControls({
  className,
  firstHref,
  hasNextPage,
  hasPreviousPage,
  label,
  nextHref,
  previousHref,
}: Readonly<{
  className?: string;
  firstHref?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  label: string;
  nextHref: string;
  previousHref: string;
}>) {
  return (
    <nav aria-label={label} className={cx("ct-pagination", className)}>
      <ButtonLink
        aria-disabled={!hasPreviousPage}
        href={previousHref}
        variant="secondary"
      >
        Previous
      </ButtonLink>
      <span>{label}</span>
      <ButtonLink
        aria-disabled={!hasNextPage}
        href={nextHref}
        variant="secondary"
      >
        Next
      </ButtonLink>
      {firstHref ? (
        <ButtonLink href={firstHref} variant="ghost">
          First page
        </ButtonLink>
      ) : null}
    </nav>
  );
}

export function Alert({
  children,
  className,
  title,
  tone = "danger",
}: Readonly<{
  children: ReactNode;
  className?: string;
  title: string;
  tone?: Tone;
}>) {
  return (
    <section className={cx("ct-alert", `ct-alert--${tone}`, className)} role="alert">
      <h2>{title}</h2>
      <div className="ct-alert__body">{children}</div>
    </section>
  );
}

export function ValidationErrorList({
  issues,
  title = "Review these issues",
}: Readonly<{
  issues: readonly ValidationIssueDisplay[];
  title?: string;
}>) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <Alert title={title} tone="danger">
      <ul className="ct-validation-list">
        {issues.map((issue, index) => (
          <li key={`${issue.field ?? "issue"}:${issue.message}:${index}`}>
            {issue.field ? <strong>{issue.field}: </strong> : null}
            {issue.message}
          </li>
        ))}
      </ul>
    </Alert>
  );
}

export function ToastMessage({
  children,
  className,
  title,
  tone = "info",
}: Readonly<{
  children: ReactNode;
  className?: string;
  title: string;
  tone?: Tone;
}>) {
  return (
    <section className={cx("ct-toast", `ct-toast--${tone}`, className)} role="status">
      <strong>{title}</strong>
      <span>{children}</span>
    </section>
  );
}

export function ConfirmationDialog({
  action,
  cancelLabel = "Cancel",
  children,
  confirmLabel,
  confirmVariant = "danger",
  description,
  dialogRef,
  hiddenFields = [],
  id,
  title,
}: Readonly<{
  action: NonNullable<FormHTMLAttributes<HTMLFormElement>["action"]>;
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  description: string;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  hiddenFields?: ReadonlyArray<{ name: string; value: string }>;
  id: string;
  title: string;
}>) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="ct-dialog"
      id={id}
      ref={dialogRef}
    >
      <form action={action} className="ct-dialog__body" method="post">
        {hiddenFields.map((field) => (
          <input key={field.name} name={field.name} type="hidden" value={field.value} />
        ))}
        <header>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </header>
        {children}
        <div className="ct-form-actions">
          <Button type="submit" variant={confirmVariant}>
            {confirmLabel}
          </Button>
          <Button formMethod="dialog" type="submit" variant="secondary">
            {cancelLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function Notice({
  action,
  children,
  className,
  title,
  tone = "info",
}: Readonly<{
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  title: string;
  tone?: Tone;
}>) {
  return (
    <section className={cx("ct-notice", `ct-notice--${tone}`, className)}>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      {action ? <ActionBar>{action}</ActionBar> : null}
    </section>
  );
}

export function ProofEventList({
  items,
}: Readonly<{
  items: readonly ProofEventListItem[];
}>) {
  return (
    <ol className="ct-proof-list">
      {items.map((event) => {
        const linkedObjectLabel = event.linkedObjectLabel ?? "Linked order";
        const organization = event.organizationLabel ?? event.actorOrganizationId ?? "Organization not recorded";
        const documentationCount = event.documentationCount ?? 0;

        return (
          <li className="ct-proof-event" key={event.id ?? `${String(event.eventType)}:${event.occurredAt}`}>
            <div className="ct-proof-event__marker" aria-hidden="true" />
            <div className="ct-proof-event__body">
              <div className="ct-proof-event__header">
                <div>
                  <h3>{formatStatusLabel(event.eventType)}</h3>
                  <p>{event.occurredAt}</p>
                </div>
                <StatusBadge value={event.status} />
              </div>
              <div className="ct-proof-event__meta">
                <Badge tone="info">{formatStatusLabel(event.source ?? "proof event")}</Badge>
                <VerificationBadge value={event.verificationLevel} />
                {event.auditStatus ? <StatusBadge value={event.auditStatus} /> : null}
              </div>
              <DetailList
                className="ct-description-list--compact"
                items={[
                  { term: "Actor", value: formatStatusLabel(event.actorRoleCode ?? "not recorded") },
                  { term: "Organization", value: organization },
                  { term: "Linked object", value: linkedObjectLabel },
                  { term: "Linked documents", value: `${documentationCount} document${documentationCount === 1 ? "" : "s"}` },
                  {
                    term: "Lifecycle",
                    value: event.lifecycleStage ? formatStatusLabel(event.lifecycleStage) : "Not recorded",
                  },
                ]}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({
  action,
  message,
  title = "No records yet",
}: Readonly<{
  action?: ReactNode;
  message: string;
  title?: string;
}>) {
  return (
    <div className="ct-state ct-state--empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <ActionBar>{action}</ActionBar> : null}
    </div>
  );
}

export function LoadingState({
  message,
  title = "Loading workspace",
}: Readonly<{
  message: string;
  title?: string;
}>) {
  return (
    <div aria-busy="true" className="ct-state ct-state--loading">
      <h1>{title}</h1>
      <p>{message}</p>
      <div className="ct-skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  title = "Unable to load workspace",
}: Readonly<{
  message: string;
  title?: string;
}>) {
  return (
    <div className="ct-state ct-state--error" role="alert">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
}

export function formatStatusLabel(value: unknown, kind?: StatusDisplayKind) {
  return formatStatusDisplayLabel(value, kind);
}

export function formatVerificationLevel(value: unknown) {
  return formatStatusDisplayLabel(value, "verification");
}

function statusTone(value: unknown, kind?: StatusDisplayKind): Tone {
  return getStatusBadgeTone(value, kind);
}
