import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  await ensureMigrated();
  const status = request.nextUrl.searchParams.get("status");

  if (status) {
    const items = await sql`
      SELECT * FROM instagram_content
      WHERE status = ${status}
      ORDER BY priority DESC, created_at DESC
    `;
    return NextResponse.json(items);
  }

  const items = await sql`
    SELECT * FROM instagram_content ORDER BY priority DESC, created_at DESC
  `;
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const sql = getDb();
  await ensureMigrated();
  const body = await request.json();

  const {
    title,
    caption,
    post_type = "Post",
    status = "backlog",
    scheduled_at,
    published_at,
    media_url,
    hashtags,
    notes,
    priority = 0,
  } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const validTypes = ["Reel", "Post", "Carrusel", "Story"];
  if (!validTypes.includes(post_type)) {
    return NextResponse.json({ error: "Invalid post_type" }, { status: 400 });
  }

  const validStatuses = ["backlog", "draft", "scheduled", "published"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO instagram_content
      (title, caption, post_type, status, scheduled_at, published_at, media_url, hashtags, notes, priority)
    VALUES
      (${title.trim()}, ${caption || null}, ${post_type}, ${status},
       ${scheduled_at || null}, ${published_at || null}, ${media_url || null},
       ${hashtags || null}, ${notes || null}, ${priority})
    RETURNING *
  ` as unknown as Record<string, unknown>[];

  return NextResponse.json(result[0], { status: 201 });
}
