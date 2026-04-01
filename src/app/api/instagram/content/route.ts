import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const db = getDb();
  const status = request.nextUrl.searchParams.get("status");

  if (status) {
    const items = db
      .prepare(
        "SELECT * FROM instagram_content WHERE status = ? ORDER BY priority DESC, created_at DESC"
      )
      .all(status);
    return NextResponse.json(items);
  }

  const items = db
    .prepare(
      "SELECT * FROM instagram_content ORDER BY priority DESC, created_at DESC"
    )
    .all();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const db = getDb();
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

  const result = db
    .prepare(
      `INSERT INTO instagram_content (title, caption, post_type, status, scheduled_at, published_at, media_url, hashtags, notes, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      caption || null,
      post_type,
      status,
      scheduled_at || null,
      published_at || null,
      media_url || null,
      hashtags || null,
      notes || null,
      priority
    );

  const item = db
    .prepare("SELECT * FROM instagram_content WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json(item, { status: 201 });
}
