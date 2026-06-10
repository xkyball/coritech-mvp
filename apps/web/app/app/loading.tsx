import { LoadingState } from "../../components/ui";

export default function AppLoading() {
  return (
    <main className="ct-main">
      <LoadingState
        message="Checking managed session state before loading protected workspace data."
        title="Loading secure workspace"
      />
    </main>
  );
}
