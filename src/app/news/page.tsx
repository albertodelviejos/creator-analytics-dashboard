import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          News Consolidator
        </h2>
        <p className="text-muted-foreground">
          Industry news and trends in one place
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI-Powered News Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50">
              <span className="text-3xl">📰</span>
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                Coming soon
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
                AI-powered news feed that aggregates and summarizes relevant
                industry news, platform updates, and creator economy trends.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {["Platform Updates", "Creator Economy", "Industry Trends"].map(
          (category) => (
            <Card key={category} className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground/60">
                  No articles yet
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
