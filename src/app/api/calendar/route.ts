import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  platform: "instagram" | "youtube";
  type: string;
  status: "published" | "scheduled" | "draft";
  url: string | null;
  views: number | null;
  likes: number | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month"); // e.g. "2026-04"
  const platform = searchParams.get("platform") || "all";

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month parameter required in YYYY-MM format" },
      { status: 400 }
    );
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const mon = parseInt(monthStr);
  const startDate = `${year}-${monthStr}-01`;
  // Last day of month
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${year}-${monthStr}-${lastDay}`;

  const db = getDb();
  const items: CalendarItem[] = [];

  // Instagram published posts
  if (platform === "all" || platform === "instagram") {
    const igPosts = db
      .prepare(
        `SELECT id, type, caption, published_at, views, likes, url
         FROM instagram_posts
         WHERE date(published_at) >= date(?) AND date(published_at) <= date(?)
         ORDER BY published_at ASC`
      )
      .all(startDate, endDate) as Array<{
      id: number;
      type: string;
      caption: string | null;
      published_at: string;
      views: number | null;
      likes: number;
      url: string | null;
    }>;

    for (const p of igPosts) {
      items.push({
        id: `ig-post-${p.id}`,
        title: p.caption ? p.caption.slice(0, 80) : "Instagram Post",
        date: p.published_at,
        platform: "instagram",
        type: p.type || "Post",
        status: "published",
        url: p.url,
        views: p.views,
        likes: p.likes,
      });
    }

    // Instagram content (scheduled items)
    const igContent = db
      .prepare(
        `SELECT id, title, caption, post_type, status, scheduled_at, published_at
         FROM instagram_content
         WHERE status = 'scheduled'
           AND scheduled_at IS NOT NULL
           AND date(scheduled_at) >= date(?)
           AND date(scheduled_at) <= date(?)
         ORDER BY scheduled_at ASC`
      )
      .all(startDate, endDate) as Array<{
      id: number;
      title: string;
      caption: string | null;
      post_type: string;
      status: string;
      scheduled_at: string;
      published_at: string | null;
    }>;

    for (const c of igContent) {
      items.push({
        id: `ig-content-${c.id}`,
        title: c.title || c.caption?.slice(0, 80) || "Untitled",
        date: c.scheduled_at,
        platform: "instagram",
        type: c.post_type || "Post",
        status: "scheduled",
        url: null,
        views: null,
        likes: null,
      });
    }
  }

  // YouTube published videos
  if (platform === "all" || platform === "youtube") {
    const ytVideos = db
      .prepare(
        `SELECT id, video_id, title, published_at, views, likes
         FROM youtube_videos
         WHERE date(published_at) >= date(?) AND date(published_at) <= date(?)
         ORDER BY published_at ASC`
      )
      .all(startDate, endDate) as Array<{
      id: number;
      video_id: string;
      title: string;
      published_at: string;
      views: number;
      likes: number;
    }>;

    for (const v of ytVideos) {
      items.push({
        id: `yt-${v.id}`,
        title: v.title,
        date: v.published_at,
        platform: "youtube",
        type: "Video",
        status: "published",
        url: `https://youtube.com/watch?v=${v.video_id}`,
        views: v.views,
        likes: v.likes,
      });
    }
  }

  return NextResponse.json({ items });
}
