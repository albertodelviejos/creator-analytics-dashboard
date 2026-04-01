export const dynamic = "force-dynamic";

import { ThreadsTabs } from "./threads-tabs";

export default function ThreadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-fuchsia-500">🧵</span> Threads
          </h2>
          <p className="text-muted-foreground">
            Content management & analytics &middot;{" "}
            <span className="text-fuchsia-400">@albertodviejo</span>
          </p>
        </div>
      </div>

      <ThreadsTabs />
    </div>
  );
}
