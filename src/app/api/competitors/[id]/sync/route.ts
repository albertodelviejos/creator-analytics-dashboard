import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface IgResult {
  username: string;
  followers: number;
  total_posts: number;
  posts: Array<{
    shortcode: string;
    type: string;
    caption: string;
    published_at: string;
    views: number;
    likes: number;
    comments: number;
    engagement_rate: number | null;
    thumbnail_url: string | null;
  }>;
  error?: string;
}

interface YtChannelStats {
  subscribers: number;
  total_views: number;
  total_videos: number;
}

interface YtVideo {
  video_id: string;
  title: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  thumbnail_url: string;
}

async function fetchYouTubeData(handle: string) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY not set");

  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;

  async function ytFetch(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
    return res.json();
  }

  // Get channel ID
  const channelData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id,statistics,contentDetails&forHandle=${cleanHandle}&key=${API_KEY}`
  );
  if (!channelData.items?.length) throw new Error(`Channel not found: ${cleanHandle}`);

  const channel = channelData.items[0];
  const stats: YtChannelStats = {
    subscribers: parseInt(channel.statistics.subscriberCount, 10),
    total_views: parseInt(channel.statistics.viewCount, 10),
    total_videos: parseInt(channel.statistics.videoCount, 10),
  };

  const uploadsPlaylist = channel.contentDetails.relatedPlaylists.uploads;

  // Get recent video IDs
  const playlistData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylist}&maxResults=30&key=${API_KEY}`
  );
  const videoIds: string[] = playlistData.items.map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );

  // Get video details
  const videos: YtVideo[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videoData = await ytFetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(",")}&key=${API_KEY}`
    );
    for (const item of videoData.items) {
      const durationMatch = item.contentDetails.duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
      );
      const h = parseInt(durationMatch?.[1] || "0", 10);
      const m = parseInt(durationMatch?.[2] || "0", 10);
      const s = parseInt(durationMatch?.[3] || "0", 10);
      const duration = h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;

      videos.push({
        video_id: item.id,
        title: item.snippet.title,
        published_at: item.snippet.publishedAt,
        views: parseInt(item.statistics.viewCount || "0", 10),
        likes: parseInt(item.statistics.likeCount || "0", 10),
        comments: parseInt(item.statistics.commentCount || "0", 10),
        duration,
        thumbnail_url:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
      });
    }
  }

  return { stats, videos };
}

function syncInstagram(competitorId: number, handle: string, db: ReturnType<typeof getDb>) {
  const cleanHandle = handle.replace("@", "");
  const output = execSync(
    `python3 scripts/fetch-competitor-ig.py ${cleanHandle}`,
    { cwd: process.cwd(), timeout: 60_000, encoding: "utf-8" }
  );

  const data: IgResult = JSON.parse(output);
  if (data.error) throw new Error(data.error);

  // Save snapshot
  db.prepare(
    `INSERT INTO competitor_snapshots (competitor_id, platform, followers, total_posts)
     VALUES (?, 'instagram', ?, ?)`
  ).run(competitorId, data.followers, data.total_posts);

  // Upsert posts
  const upsert = db.prepare(`
    INSERT INTO competitor_posts (competitor_id, platform, post_id, title, post_type, url, published_at, views, likes, comments, engagement_rate, thumbnail_url, fetched_at)
    VALUES (?, 'instagram', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(competitor_id, platform, post_id) DO UPDATE SET
      views = excluded.views, likes = excluded.likes, comments = excluded.comments,
      engagement_rate = excluded.engagement_rate, fetched_at = CURRENT_TIMESTAMP
  `);

  const insertMany = db.transaction((posts: IgResult["posts"]) => {
    for (const p of posts) {
      upsert.run(
        competitorId, p.shortcode, p.caption, p.type,
        `https://www.instagram.com/p/${p.shortcode}/`,
        p.published_at, p.views, p.likes, p.comments,
        p.engagement_rate, p.thumbnail_url
      );
    }
  });
  insertMany(data.posts);

  return { posts: data.posts.length, followers: data.followers };
}

async function syncYouTube(competitorId: number, handle: string, db: ReturnType<typeof getDb>) {
  const { stats, videos } = await fetchYouTubeData(handle);

  // Save snapshot
  db.prepare(
    `INSERT INTO competitor_snapshots (competitor_id, platform, followers, total_posts)
     VALUES (?, 'youtube', ?, ?)`
  ).run(competitorId, stats.subscribers, stats.total_videos);

  // Upsert videos
  const upsert = db.prepare(`
    INSERT INTO competitor_posts (competitor_id, platform, post_id, title, post_type, url, published_at, views, likes, comments, engagement_rate, thumbnail_url, fetched_at)
    VALUES (?, 'youtube', ?, ?, 'Video', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(competitor_id, platform, post_id) DO UPDATE SET
      views = excluded.views, likes = excluded.likes, comments = excluded.comments,
      engagement_rate = excluded.engagement_rate, fetched_at = CURRENT_TIMESTAMP
  `);

  const insertMany = db.transaction((vids: YtVideo[]) => {
    for (const v of vids) {
      const total = v.likes + v.comments;
      const engRate = v.views > 0 ? Math.round((total / v.views) * 10000) / 100 : null;
      upsert.run(
        competitorId, v.video_id, v.title,
        `https://www.youtube.com/watch?v=${v.video_id}`,
        v.published_at, v.views, v.likes, v.comments,
        engRate, v.thumbnail_url
      );
    }
  });
  insertMany(videos);

  return { videos: videos.length, subscribers: stats.subscribers };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const id = parseInt(params.id, 10);

  const competitor = db.prepare("SELECT * FROM competitors WHERE id = ?").get(id) as
    | { id: number; instagram_handle: string | null; youtube_handle: string | null }
    | undefined;

  if (!competitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result: Record<string, unknown> = { success: true };

  try {
    if (competitor.instagram_handle) {
      result.instagram = syncInstagram(id, competitor.instagram_handle, db);
    }
  } catch (err) {
    result.instagram_error = err instanceof Error ? err.message : "Instagram sync failed";
  }

  try {
    if (competitor.youtube_handle) {
      result.youtube = await syncYouTube(id, competitor.youtube_handle, db);
    }
  } catch (err) {
    result.youtube_error = err instanceof Error ? err.message : "YouTube sync failed";
  }

  return NextResponse.json(result);
}
