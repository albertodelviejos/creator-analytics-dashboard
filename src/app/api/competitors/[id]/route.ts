import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const id = parseInt(params.id, 10);

  const competitor = db
    .prepare("SELECT * FROM competitors WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!competitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = db
    .prepare(
      "SELECT * FROM competitor_posts WHERE competitor_id = ? ORDER BY published_at DESC"
    )
    .all(id);

  const snapshots = db
    .prepare(
      "SELECT * FROM competitor_snapshots WHERE competitor_id = ? ORDER BY recorded_at DESC"
    )
    .all(id);

  return NextResponse.json({ ...competitor, posts, snapshots });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const id = parseInt(params.id, 10);
  const body = await request.json();

  const existing = db.prepare("SELECT * FROM competitors WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of ["name", "instagram_handle", "youtube_handle", "notes"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE competitors SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const updated = db.prepare("SELECT * FROM competitors WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const id = parseInt(params.id, 10);

  // Delete cascade manually since SQLite FK enforcement needs PRAGMA
  db.prepare("DELETE FROM competitor_posts WHERE competitor_id = ?").run(id);
  db.prepare("DELETE FROM competitor_snapshots WHERE competitor_id = ?").run(id);
  db.prepare("DELETE FROM competitors WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
