import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes as ReactInputHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

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
  label,
  value,
}: Readonly<{
  label?: string;
  value: unknown;
}>) {
  const formatted = label ?? formatStatusLabel(value);
  const tone = statusTone(value);

  return (
    <span className={cx("ct-badge", "ct-badge--status", `ct-badge--${tone}`)}>
      <span className="ct-badge__dot" aria-hidden="true" />
      {formatted}
    </span>
  );
}

export function VerificationBadge({
  value,
}: Readonly<{
  value: unknown;
}>) {
  return <StatusBadge label={formatVerificationLevel(value)} value={value} />;
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

export function Input({
  className,
  ...props
}: Readonly<InputHTMLAttributes<HTMLInputElement>>) {
  return <input className={cx("ct-input", className)} {...props} />;
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

export function formatStatusLabel(value: unknown) {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatVerificationLevel(value: unknown) {
  const normalized = String(value).toUpperCase();
  const labels: Record<string, string> = {
    SELF_REPORTED: "Self-reported",
    SYSTEM_RECORDED: "System-recorded",
    STATION_CONFIRMED: "Station-confirmed",
    ADMIN_REVIEWED: "Admin-reviewed",
    VET_SIGNED: "Vet-signed",
    FEDERATION_ATTESTED: "Federation-attested",
    VERIFIED_FOR_TRANSACTION: "Verified for transaction",
  };

  return labels[normalized] ?? formatStatusLabel(value);
}

function statusTone(value: unknown): Tone {
  const normalized = String(value).toLowerCase();

  if (
    normalized.includes("unavailable") ||
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("error") ||
    normalized.includes("fail")
  ) {
    return "danger";
  }

  if (
    normalized.includes("verified") ||
    normalized.includes("available") ||
    normalized === "active" ||
    normalized.includes("complete") ||
    normalized.includes("delivered") ||
    normalized.includes("submitted") ||
    normalized.includes("approved")
  ) {
    return "success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("draft") ||
    normalized.includes("requested") ||
    normalized.includes("transit") ||
    normalized.includes("review")
  ) {
    return "warning";
  }

  if (
    normalized.includes("tracking") ||
    normalized.includes("shipment") ||
    normalized.includes("document") ||
    normalized.includes("proof")
  ) {
    return "info";
  }

  return "neutral";
}
