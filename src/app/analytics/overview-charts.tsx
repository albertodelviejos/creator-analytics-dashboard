"use client";

import { EngagementChart } from "@/components/EngagementChart";

interface ChartDataPoint {
  label: string;
  instagram: number;
  youtube: number;
}

interface Top5Item {
  label: string;
  platform: string;
  engagement: number;
  date: string;
}

interface OverviewChartsProps {
  chartData: ChartDataPoint[];
  top5: Top5Item[];
}

export function OverviewCharts({ chartData }: OverviewChartsProps) {
  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border p-12 text-center text-muted-foreground">
        No data yet. Sync your platforms to see engagement trends.
      </div>
    );
  }

  return (
    <EngagementChart
      title="Engagement Over Time"
      data={chartData}
      series={[
        { key: "instagram", name: "Instagram", color: "#ec4899" },
        { key: "youtube", name: "YouTube", color: "#ef4444" },
      ]}
      type="line"
    />
  );
}
