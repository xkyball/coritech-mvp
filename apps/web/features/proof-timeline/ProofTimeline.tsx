import {
  EmptyState,
  ProofEventList,
} from "../../components/ui";
import type { ProofTimelineViewModel } from "./proof-timeline.d.ts";

export function ProofTimeline({
  viewModel,
}: Readonly<{
  viewModel: ProofTimelineViewModel;
}>) {
  if (viewModel.items.length === 0) {
    return <EmptyState message={viewModel.emptyMessage} title="No proof events" />;
  }

  return <ProofEventList items={viewModel.items} />;
}
