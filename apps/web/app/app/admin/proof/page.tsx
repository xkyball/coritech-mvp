import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";
import { createPrismaSemenOrderRepository } from "../../../../features/order-creation/prisma-semen-order-repository";
import { ProofTimeline } from "../../../../features/proof-timeline/ProofTimeline";
import { createProofTimelineViewModel } from "../../../../features/proof-timeline/proof-timeline.mjs";
import {
  Card,
  DashboardShell,
  PageHeader,
  SectionHeader,
} from "../../../../components/ui";
import { adminNavigation } from "../../../../features/navigation";

type AdminProofSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function AdminProofTimelinePage({
  searchParams,
}: Readonly<{
  searchParams?: AdminProofSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const activeContext = await requireActiveContextActor("PLATFORM_ADMIN");
  const orderRepository = createPrismaSemenOrderRepository();
  const documentRepository = createPrismaDocumentRepository();
  const orderId = firstSearchParam(resolvedSearchParams?.orderId);
  const proofEvents = await orderRepository.listProofEvents({
    semenOrderId: orderId,
    limit: 100,
  });
  const orderIds = [...new Set(proofEvents.flatMap((event) =>
    event.semenOrderId ? [event.semenOrderId] : []
  ))];
  const documents = orderIds.length > 0
    ? await documentRepository.listDocumentsForOrders(orderIds)
    : [];
  const viewModel = createProofTimelineViewModel({
    title: "Admin proof timeline",
    emptyMessage: orderId
      ? "No proof events have been recorded for this order."
      : "No proof events have been recorded.",
    orderId,
    proofEvents,
    documents,
  });

  return (
    <DashboardShell
      activeHref="/app/admin/proof"
      navigation={adminNavigation}
      organizationName={activeContext.organizationName}
      roleLabel="Platform Admin"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Platform admin"
          subtitle="Inspect recorded proof events without changing order, document or shipment evidence."
          title="Proof timeline"
        />
        <Card aria-labelledby="admin-proof-timeline-heading">
          <SectionHeader
            count={`${viewModel.items.length} events`}
            id="admin-proof-timeline-heading"
            title={viewModel.title}
          />
          <ProofTimeline viewModel={viewModel} />
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
