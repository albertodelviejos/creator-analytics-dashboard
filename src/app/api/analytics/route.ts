import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

interface InstagramRow {
  url: string;
  shortcode: string;
  type: string;
  caption: string | null;
  published_at: string;
  views: number | null;
  likes: number;
  comments: number;
  engagement_rate: number | null;
}

interface YouTubeRow {
  video_id: string;
  title: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail_url: string | null;
}

interface ChannelStatsRow {
  subscribers: number;
  total_views: number;
  total_videos: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from") || "2000-01-01";
  const to = searchParams.get("to") || "2099-12-31";
  const platform = searchParams.get("platform") || "all";

  const sql = getDb();
  await ensureMigrated();

  // Fetch Instagram posts (if applicable)
  let igPosts: InstagramRow[] = [];
  if (platform === "all" || platform === "instagram") {
    igPosts = await sql`
      SELECT url, shortcode, type, caption, published_at, views, likes, comments, engagement_rate
      FROM instagram_posts
      WHERE published_at::date >= ${from}::date AND published_at::date <= ${to}::date
      ORDER BY published_at DESC
    ` as unknown as InstagramRow[];
  }

  // Fetch YouTube videos (if applicable)
  let ytVideos: YouTubeRow[] = [];
  if (platform === "all" || platform === "youtube") {
    ytVideos = await sql`
      SELECT video_id, title, published_at, views, likes, comments, thumbnail_url
      FROM youtube_videos
      WHERE published_at::date >= ${from}::date AND published_at::date <= ${to}::date
      ORDER BY published_at DESC
    ` as unknown as YouTubeRow[];
  }

  // Channel stats (latest)
  const channelStatsRows = await sql`
    SELECT subscribers, total_views, total_videos FROM youtube_channel_stats ORDER BY recorded_at DESC LIMIT 1
  ` as unknown as ChannelStatsRow[];
  const channelStats = channelStatsRows[0] as ChannelStatsRow | undefined;

  // Summary stats
  const totalIgViews = igPosts.reduce((s, p) => s + (p.views ?? 0), 0);
  const totalYtViews = ytVideos.reduce((s, v) => s + v.views, 0);
  const totalImpressions = totalIgViews + totalYtViews;

  const totalIgEngagement = igPosts.reduce(
    (s, p) => s + p.likes + p.comments,
    0
  );
  const totalYtEngagement = ytVideos.reduce(
    (s, v) => s + v.likes + v.comments,
    0
  );
  const totalEngagement = totalIgEngagement + totalYtEngagement;

  const totalContent = igPosts.length + ytVideos.length;

  // Average engagement rate
  const allRates = [
    ...igPosts
      .filter((p) => p.engagement_rate != null)
      .map((p) => p.engagement_rate!),
    ...ytVideos.map((v) =>
      v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0
    ),
  ];
  const avgEngagementRate =
    allRates.length > 0
      ? allRates.reduce((s, r) => s + r, 0) / allRates.length
      : 0;

  // Timeline data (group by date)
  const timelineMap = new Map<
    string,
    { igViews: number; ytViews: number; igEng: number; ytEng: number }
  >();

  for (const p of igPosts) {
    const date = p.published_at.slice(0, 10);
    const existing = timelineMap.get(date) || {
      igViews: 0,
      ytViews: 0,
      igEng: 0,
      ytEng: 0,
    };
    existing.igViews += p.views ?? 0;
    existing.igEng += p.likes + p.comments;
    timelineMap.set(date, existing);
  }

  for (const v of ytVideos) {
    const date = v.published_at.slice(0, 10);
    const existing = timelineMap.get(date) || {
      igViews: 0,
      ytViews: 0,
      igEng: 0,
      ytEng: 0,
    };
    existing.ytViews += v.views;
    existing.ytEng += v.likes + v.comments;
    timelineMap.set(date, existing);
  }

  const timeline = Array.from(timelineMap.entries())
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top performing content (by views, cross-platform)
  const topContent = [
    ...igPosts.map((p) => ({
      platform: "instagram" as const,
      title: p.caption?.slice(0, 80) || p.shortcode,
      type: p.type,
      views: p.views ?? 0,
      likes: p.likes,
      comments: p.comments,
      engagementRate: p.engagement_rate ?? 0,
      date: p.published_at.slice(0, 10),
      url: p.url,
      thumbnail: null as string | null,
    })),
    ...ytVideos.map((v) => ({
      platform: "youtube" as const,
      title: v.title,
      type: "Video",
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      engagementRate:
        v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0,
      date: v.published_at.slice(0, 10),
      url: `https://youtube.com/watch?v=${v.video_id}`,
      thumbnail: v.thumbnail_url,
    })),
  ]
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  // Platform breakdown
  const platformBreakdown = {
    instagram: {
      count: igPosts.length,
      views: totalIgViews,
      engagement: totalIgEngagement,
    },
    youtube: {
      count: ytVideos.length,
      views: totalYtViews,
      engagement: totalYtEngagement,
    },
  };

  // Content type breakdown
  const typeMap = new Map<string, number>();
  for (const p of igPosts) {
    typeMap.set(p.type, (typeMap.get(p.type) || 0) + 1);
  }
  if (ytVideos.length > 0) {
    typeMap.set("YouTube Video", ytVideos.length);
  }
  const contentTypeBreakdown = Array.from(typeMap.entries()).map(
    ([type, count]) => ({ type, count })
  );

  // Top by engagement (for bar chart)
  const topByEngagement = [
    ...igPosts.map((p) => ({
      platform: "instagram" as const,
      title:
        (p.caption?.slice(0, 25) || p.shortcode) +
        (p.caption && p.caption.length > 25 ? "..." : ""),
      engagement: p.likes + p.comments,
    })),
    ...ytVideos.map((v) => ({
      platform: "youtube" as const,
      title: v.title.slice(0, 25) + (v.title.length > 25 ? "..." : ""),
      engagement: v.likes + v.comments,
    })),
  ]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 15);

  // Top by engagement rate
  const topByEngRate = [
    ...igPosts.map((p) => ({
      platform: "instagram" as const,
      title:
        (p.caption?.slice(0, 25) || p.shortcode) +
        (p.caption && p.caption.length > 25 ? "..." : ""),
      engagementRate: p.engagement_rate ?? 0,
      views: p.views ?? 0,
    })),
    ...ytVideos.map((v) => ({
      platform: "youtube" as const,
      title: v.title.slice(0, 25) + (v.title.length > 25 ? "..." : ""),
      engagementRate:
        v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0,
      views: v.views,
    })),
  ]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10);

  return NextResponse.json({
    summary: {
      totalImpressions,
      totalEngagement,
      avgEngagementRate,
      totalContent,
      followers: channelStats?.subscribers ?? 0,
      igViews: totalIgViews,
      ytViews: totalYtViews,
    },
    timeline,
    topContent,
    platformBreakdown,
    contentTypeBreakdown,
    topByEngagement,
    topByEngRate,
  });
}
