export const dynamic = "force-dynamic";

import { getDb, ensureMigrated } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { YouTubeContent } from "./youtube-content";

interface YouTubeVideo {
  id: number;
  video_id: string;
  title: string;
  description: string | null;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  duration: string | null;
  thumbnail_url: string | null;
}

interface ChannelStats {
  id: number;
  subscribers: number;
  total_views: number;
  total_videos: number;
  recorded_at: string;
}

async function getData() {
  const sql = getDb();
  await ensureMigrated();

  const videos = await sql`SELECT * FROM youtube_videos ORDER BY published_at DESC` as YouTubeVideo[];
  const channelHistory = await sql`SELECT * FROM youtube_channel_stats ORDER BY recorded_at DESC LIMIT 30` as ChannelStats[];

  return { videos, channelHistory };
}

export default async function YouTubePage() {
  const { videos, channelHistory } = await getData();

  const latest = channelHistory[0];
  const avgViews =
    videos.length > 0
      ? Math.round(videos.reduce((s, v) => s + v.views, 0) / videos.length)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">YouTube</h2>
        <p className="text-muted-foreground">Channel & video analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Subscribers"
          value={formatNumber(latest?.subscribers ?? 0)}
          icon={<span className="text-2xl">👥</span>}
        />
        <StatCard
          label="Total Views"
          value={formatNumber(latest?.total_views ?? 0)}
          icon={<span className="text-2xl">👁️</span>}
        />
        <StatCard
          label="Total Videos"
          value={latest?.total_videos ?? 0}
          icon={<span className="text-2xl">🎬</span>}
        />
        <StatCard
          label="Avg Views/Video"
          value={formatNumber(avgViews)}
          icon={<span className="text-2xl">📊</span>}
        />
      </div>

      <YouTubeContent videos={videos} channelHistory={channelHistory} />
    </div>
  );
}
