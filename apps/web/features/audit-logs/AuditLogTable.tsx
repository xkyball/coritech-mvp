import {
  Badge,
  EmptyState,
  Table,
} from "../../components/ui";
import type { AuditLogViewerViewModel } from "./audit-log-viewer.d.ts";

export function AuditLogTable({
  viewModel,
}: Readonly<{
  viewModel: AuditLogViewerViewModel;
}>) {
  if (viewModel.rows.length === 0) {
    return (
      <EmptyState
        message="No audit logs matched the current admin query."
        title="No audit logs"
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>Actor</th>
          <th>Object</th>
          <th>Reason</th>
          <th>Request</th>
        </tr>
      </thead>
      <tbody>
        {viewModel.rows.map((row) => (
          <tr key={row.id ?? `${row.action}:${row.objectId}:${row.occurredAt}`}>
            <td>{row.occurredAt}</td>
            <td>
              <div className="ct-table-cell-stack">
                <Badge tone={toneForOutcome(row.outcome)}>{row.outcomeLabel}</Badge>
                <span>{row.actionLabel}</span>
                {row.sourceAction ? <small>{row.sourceAction}</small> : null}
                <details className="ct-row-details">
                  <summary>Payload</summary>
                  <div>
                    <strong>Object</strong>
                    <pre>{row.objectRef}</pre>
                    <strong>Previous</strong>
                    <pre>{row.previousValues}</pre>
                    <strong>New</strong>
                    <pre>{row.newValues}</pre>
                    <strong>Metadata</strong>
                    <pre>{row.metadata}</pre>
                  </div>
                </details>
              </div>
            </td>
            <td>
              <div className="ct-table-cell-stack">
                <strong>{row.actorRoleCode}</strong>
                <span>{row.actorUserId}</span>
                <small>{row.actorOrganizationId}</small>
              </div>
            </td>
            <td>
              <div className="ct-table-cell-stack">
                <strong>{row.objectType}</strong>
                <span>{row.objectId}</span>
              </div>
            </td>
            <td>{row.reason ?? "No reason recorded"}</td>
            <td>{row.requestLabel}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function toneForOutcome(outcome: string | null): "danger" | "success" | "info" {
  if (outcome === "DENY") {
    return "danger";
  }

  if (outcome === "ALLOW") {
    return "success";
  }

  return "info";
}
