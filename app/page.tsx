import { serverIdentity } from "@/lib/amplitude/server";
import { Demo } from "./demo";

export default async function Page() {
  // Already correct on the very first render — the proxy ran before this.
  const identity = await serverIdentity();

  return (
    <main>
      <pre>{JSON.stringify(identity, null, 2)}</pre>
      <Demo />
    </main>
  );
}
