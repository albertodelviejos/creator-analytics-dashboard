import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb();
  await ensureMigrated();
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await sql`SELECT * FROM instagram_content WHERE id = ${id}` as unknown as Record<string, unknown>[];
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  // Merge body into existing record, only updating allowed fields
  const rec = existing[0] as Record<string, unknown>;
  const title = "title" in body ? body.title : rec.title;
  const caption = "caption" in body ? body.caption : rec.caption;
  const post_type = "post_type" in body ? body.post_type : rec.post_type;
  const status = "status" in body ? body.status : rec.status;
  const scheduled_at = "scheduled_at" in body ? body.scheduled_at : rec.scheduled_at;
  const published_at = "published_at" in body ? body.published_at : rec.published_at;
  const media_url = "media_url" in body ? body.media_url : rec.media_url;
  const hashtags = "hashtags" in body ? body.hashtags : rec.hashtags;
  const notes = "notes" in body ? body.notes : rec.notes;
  const priority = "priority" in body ? body.priority : rec.priority;

  const updated = await sql`
    UPDATE instagram_content SET
      title = ${title},
      caption = ${caption},
      post_type = ${post_type},
      status = ${status},
      scheduled_at = ${scheduled_at},
      published_at = ${published_at},
      media_url = ${media_url},
      hashtags = ${hashtags},
      notes = ${notes},
      priority = ${priority},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  ` as unknown as Record<string, unknown>[];

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb();
  await ensureMigrated();
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = await sql`DELETE FROM instagram_content WHERE id = ${id} RETURNING id` as unknown as Record<string, unknown>[];

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
