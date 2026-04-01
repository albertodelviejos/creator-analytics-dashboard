import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLACEHOLDER_SLOTS = 4;

export default function CompetitorsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Competitor Tracker
          </h2>
          <p className="text-muted-foreground">
            Monitor competitor performance across platforms
          </p>
        </div>
        <Button variant="outline" disabled>
          + Add Competitor
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: PLACEHOLDER_SLOTS }).map((_, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                <span className="text-xl text-muted-foreground/50">+</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Add competitor
              </p>
              <p className="text-xs text-muted-foreground/60">
                Track followers, engagement, and posting frequency
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Compare your growth and engagement metrics against competitors
          side-by-side. Coming soon.
        </p>
      </div>
    </div>
  );
}
