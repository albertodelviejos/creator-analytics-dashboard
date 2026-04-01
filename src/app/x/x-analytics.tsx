"use client";

import { Card, CardContent } from "@/components/ui/card";

export function XAnalytics() {
  return (
    <Card className="border-zinc-800">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
          <span className="text-5xl">𝕏</span>
          <h3 className="text-lg font-semibold text-zinc-100">
            Connect your X Developer account to see analytics
          </h3>
          <div className="max-w-md space-y-3 text-sm text-zinc-400">
            <p>Follow these steps to enable X analytics:</p>
            <ol className="text-left space-y-2 list-decimal list-inside">
              <li>
                Go to{" "}
                <span className="text-sky-400 font-medium">developer.x.com</span>
              </li>
              <li>Create a project and app</li>
              <li>
                Add your API key in{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-sky-300">
                  .env.local
                </code>{" "}
                as{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-sky-300">
                  X_API_KEY
                </code>
              </li>
            </ol>
          </div>
          <div className="pt-4 text-xs text-zinc-600">
            Once connected, you&apos;ll see impressions, engagement, and follower growth here.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
