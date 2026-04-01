import { Card, CardContent } from "@/components/ui/card";

export default function LinkedInPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">LinkedIn</h2>
        <p className="text-muted-foreground">Professional network analytics</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <span className="text-5xl mb-4">💼</span>
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            LinkedIn integration is in development. The database schema is ready
            to track posts, impressions, clicks, and profile stats. Stay tuned
            for the next update.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-center">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Posts</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Impressions</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
