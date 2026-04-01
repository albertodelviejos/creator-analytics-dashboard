export const dynamic = "force-dynamic";

import { XTabs } from "./x-tabs";

export default function XPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-sky-500">𝕏</span> X (Twitter)
          </h2>
          <p className="text-muted-foreground">
            Content management & analytics &middot;{" "}
            <span className="text-sky-400">@AlbertoDelViejo</span>
          </p>
        </div>
      </div>

      <XTabs />
    </div>
  );
}
