# Blocked Tickets

Analysis date: 2026-06-10

These tickets are blocked or materially sequenced behind missing foundations. A ticket can still have some backend evidence while its usable implementation is blocked by auth/session, active context or service wiring.

| Phase | Ticket | Status | Blockers | Recommended Action |
| --- | --- | --- | --- | --- |
| phase-1 | [8.1 Create Admin dashboard](../phase-1/08-01-admin-dashboard.md) | BLOCKED | 18.03 login/session; 18.05 active role context; 18.09 order service | Defer until auth/session, active role context and core command/query services exist. |
| phase-1-1 | [18.30 Root Routing and Role Redirects](../phase-1-1/18-30-root-routing-role-redirects.md) | BLOCKED | 18.03 login/session; 18.05 active organization/role context | Implement after 18.03 login/session and 18.05 active role context. |
| phase-1-1 | [18.04 User Invitation and First-Time Onboarding Flow](../phase-1-1/18-04-user-invitation-onboarding-flow.md) | BLOCKED | 18.03 login/session; 18.05 active organization/role context | Implement after login/session and active context exist. |
| phase-1-1 | [18.20 Admin Order Support View](../phase-1-1/18-20-admin-order-support-view.md) | BLOCKED | 18.03 login/session; 18.05 active role context; 18.09 order service | Defer until auth/context and OrderService/query surfaces exist. |
| phase-1-1 | [18.21 Audit Log Viewer UI](../phase-1-1/18-21-audit-log-viewer-ui.md) | BLOCKED | 18.03 login/session; 18.05 active role context | Defer until admin auth and audit query APIs are wired. |
| phase-1-1 | [18.22 Permission Management UI](../phase-1-1/18-22-permission-management-ui.md) | BLOCKED | 18.03 login/session; 18.05 active role context; 18.23 API/service conventions | Defer UI until admin auth and service conventions exist. |
