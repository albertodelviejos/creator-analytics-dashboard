export const dynamic = "force-dynamic";

import { getDb } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { OverviewCharts } from "./overview-charts";

interface InstagramPost {
  id: number;
  likes: number;
  comments: number;
  views: number | null;
  published_at: string;
  caption: string;
  type: string;
  engagement_rate: number | null;
  shortcode: string;
}

interface YouTubeVideo {
  id: number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  published_at: string;
}

interface ChannelStats {
  subscribers: number;
}

function getData() {
  const db = getDb();

  const igPosts = db
    .prepare("SELECT * FROM instagram_posts ORDER BY published_at DESC")
    .all() as InstagramPost[];

  const ytVideos = db
    .prepare("SELECT * FROM youtube_videos ORDER BY published_at DESC")
    .all() as YouTubeVideo[];

  const ytChannel = db
    .prepare(
      "SELECT * FROM youtube_channel_stats ORDER BY recorded_at DESC LIMIT 1"
    )
    .get() as ChannelStats | undefined;

  return { igPosts, ytVideos, ytChannel };
}

export default function OverviewPage() {
  const { igPosts, ytVideos, ytChannel } = getData();

  const totalIgLikes = igPosts.reduce((s, p) => s + p.likes, 0);

  // Build engagement over time data (last 30 items)
  const allContent = [
    ...igPosts.map((p) => ({
      date: p.published_at.slice(0, 10),
      platform: "Instagram" as const,
      engagement: p.likes + p.comments,
      label: p.caption?.slice(0, 30) || p.shortcode,
    })),
    ...ytVideos.map((v) => ({
      date: v.published_at.slice(0, 10),
      platform: "YouTube" as const,
      engagement: v.likes + v.comments,
      label: v.title.slice(0, 30),
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  // Top 5 by engagement
  const top5 = [...allContent]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Group engagement by date for chart
  const dateMap = new Map<
    string,
    { instagram: number; youtube: number }
  >();
  for (const item of allContent) {
    const existing = dateMap.get(item.date) || {
      instagram: 0,
      youtube: 0,
    };
    if (item.platform === "Instagram") {
      existing.instagram += item.engagement;
    } else {
      existing.youtube += item.engagement;
    }
    dateMap.set(item.date, existing);
  }

  const chartData = Array.from(dateMap.entries())
    .map(([date, vals]) => ({
      label: date,
      instagram: vals.instagram,
      youtube: vals.youtube,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Cross-platform content performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Instagram Posts"
          value={igPosts.length}
          icon={<span className="text-2xl">📸</span>}
        />
        <StatCard
          label="YouTube Videos"
          value={ytVideos.length}
          icon={<span className="text-2xl">▶️</span>}
        />
        <StatCard
          label="Total IG Likes"
          value={formatNumber(totalIgLikes)}
          icon={<span className="text-2xl">❤️</span>}
        />
        <StatCard
          label="YT Subscribers"
          value={formatNumber(ytChannel?.subscribers ?? 0)}
          icon={<span className="text-2xl">👥</span>}
        />
      </div>

      <OverviewCharts chartData={chartData} top5={top5} />

      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Top Content by Engagement
        </h3>
        <div className="space-y-3">
          {top5.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No data yet. Sync your platforms to see top content.
            </p>
          ) : (
            top5.map((item, i) => (
              <div
                key={`${item.platform}-${item.date}-${i}`}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.platform} &middot; {item.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {formatNumber(item.engagement)}
                  </p>
                  <p className="text-xs text-muted-foreground">interactions</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
