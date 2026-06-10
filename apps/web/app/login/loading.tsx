import { LoadingState } from "../../components/ui";

export default function LoginLoading() {
  return (
    <main className="ct-main">
      <LoadingState
        message="Checking managed auth availability before showing the login entry point."
        title="Loading login"
      />
    </main>
  );
}
