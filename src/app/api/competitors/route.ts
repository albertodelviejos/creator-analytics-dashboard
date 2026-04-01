import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();

  const competitors = db
    .prepare("SELECT * FROM competitors ORDER BY created_at DESC")
    .all() as Array<{
    id: number;
    name: string;
    instagram_handle: string | null;
    youtube_handle: string | null;
    x_handle: string | null;
    threads_handle: string | null;
    notes: string | null;
    created_at: string;
  }>;

  // Get latest snapshot per competitor per platform
  const snapshots = db
    .prepare(
      `SELECT cs.* FROM competitor_snapshots cs
       INNER JOIN (
         SELECT competitor_id, platform, MAX(recorded_at) as max_date
         FROM competitor_snapshots
         GROUP BY competitor_id, platform
       ) latest ON cs.competitor_id = latest.competitor_id
         AND cs.platform = latest.platform
         AND cs.recorded_at = latest.max_date`
    )
    .all() as Array<{
    competitor_id: number;
    platform: string;
    followers: number | null;
    total_posts: number | null;
    recorded_at: string;
  }>;

  // Get post counts and avg engagement per competitor
  const postStats = db
    .prepare(
      `SELECT competitor_id, platform, COUNT(*) as post_count,
              AVG(engagement_rate) as avg_engagement
       FROM competitor_posts
       GROUP BY competitor_id, platform`
    )
    .all() as Array<{
    competitor_id: number;
    platform: string;
    post_count: number;
    avg_engagement: number | null;
  }>;

  const result = competitors.map((c) => {
    const cSnapshots = snapshots.filter((s) => s.competitor_id === c.id);
    const cPostStats = postStats.filter((s) => s.competitor_id === c.id);

    const igSnapshot = cSnapshots.find((s) => s.platform === "instagram");
    const ytSnapshot = cSnapshots.find((s) => s.platform === "youtube");
    const igPostStat = cPostStats.find((s) => s.platform === "instagram");
    const ytPostStat = cPostStats.find((s) => s.platform === "youtube");

    return {
      ...c,
      instagram_followers: igSnapshot?.followers ?? null,
      youtube_subscribers: ytSnapshot?.followers ?? null,
      instagram_posts_count: igPostStat?.post_count ?? 0,
      youtube_posts_count: ytPostStat?.post_count ?? 0,
      avg_engagement:
        (igPostStat?.avg_engagement ?? 0) + (ytPostStat?.avg_engagement ?? 0) > 0
          ? ((igPostStat?.avg_engagement ?? 0) * (igPostStat?.post_count ?? 0) +
              (ytPostStat?.avg_engagement ?? 0) * (ytPostStat?.post_count ?? 0)) /
            ((igPostStat?.post_count ?? 0) + (ytPostStat?.post_count ?? 0))
          : null,
      last_synced: cSnapshots.length
        ? cSnapshots.reduce((a, b) =>
            a.recorded_at > b.recorded_at ? a : b
          ).recorded_at
        : null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, instagram_handle, youtube_handle, x_handle, threads_handle, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO competitors (name, instagram_handle, youtube_handle, x_handle, threads_handle, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      instagram_handle || null,
      youtube_handle || null,
      x_handle || null,
      threads_handle || null,
      notes || null
    );

  const competitor = db
    .prepare("SELECT * FROM competitors WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json(competitor, { status: 201 });
}
