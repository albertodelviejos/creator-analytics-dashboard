import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  await ensureMigrated();
  const status = request.nextUrl.searchParams.get("status");

  if (status) {
    const items = await sql`
      SELECT * FROM threads_content
      WHERE status = ${status}
      ORDER BY priority DESC, created_at DESC
    `;
    return NextResponse.json(items);
  }

  const items = await sql`
    SELECT * FROM threads_content ORDER BY priority DESC, created_at DESC
  `;
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const sql = getDb();
  await ensureMigrated();
  const body = await request.json();

  const {
    title,
    text,
    post_type = "text",
    status = "backlog",
    scheduled_at,
    published_at,
    hashtags,
    notes,
    priority = 0,
  } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const validTypes = ["text", "image", "video", "carousel"];
  if (!validTypes.includes(post_type)) {
    return NextResponse.json({ error: "Invalid post_type" }, { status: 400 });
  }

  const validStatuses = ["backlog", "draft", "scheduled", "published"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO threads_content
      (title, text, post_type, status, scheduled_at, published_at, hashtags, notes, priority)
    VALUES
      (${title.trim()}, ${text || null}, ${post_type}, ${status},
       ${scheduled_at || null}, ${published_at || null},
       ${hashtags || null}, ${notes || null}, ${priority})
    RETURNING *
  ` as unknown as Record<string, unknown>[];

  return NextResponse.json(result[0], { status: 201 });
}
