"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ThreadsAnalytics() {
  return (
    <Card className="border-zinc-800">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
          <span className="text-5xl">🧵</span>
          <h3 className="text-lg font-semibold text-zinc-100">
            Threads API coming soon
          </h3>
          <div className="max-w-md space-y-3 text-sm text-zinc-400">
            <p>Connect via Meta Developer portal to enable Threads analytics:</p>
            <ol className="text-left space-y-2 list-decimal list-inside">
              <li>
                Go to{" "}
                <span className="text-fuchsia-400 font-medium">developers.facebook.com</span>
              </li>
              <li>Create an app with Threads API access</li>
              <li>
                Add your access token in{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-fuchsia-300">
                  .env.local
                </code>{" "}
                as{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-fuchsia-300">
                  THREADS_ACCESS_TOKEN
                </code>
              </li>
            </ol>
          </div>
          <div className="pt-4 text-xs text-zinc-600">
            Once connected, you&apos;ll see likes, replies, reposts, and reach here.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
