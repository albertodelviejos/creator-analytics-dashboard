import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb();
  await ensureMigrated();
  const id = parseInt(params.id, 10);

  const competitors = await sql`SELECT * FROM competitors WHERE id = ${id}` as unknown as Record<string, unknown>[];
  if (!competitors[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = await sql`
    SELECT * FROM competitor_posts WHERE competitor_id = ${id} ORDER BY published_at DESC
  ` as unknown as Record<string, unknown>[];

  const snapshots = await sql`
    SELECT * FROM competitor_snapshots WHERE competitor_id = ${id} ORDER BY recorded_at DESC
  ` as unknown as Record<string, unknown>[];

  return NextResponse.json({ ...competitors[0], posts, snapshots });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb();
  await ensureMigrated();
  const id = parseInt(params.id, 10);
  const body = await request.json();

  const existing = await sql`SELECT * FROM competitors WHERE id = ${id}` as unknown as Record<string, unknown>[];
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rec = existing[0] as Record<string, unknown>;
  const name = "name" in body ? body.name : rec.name;
  const instagram_handle = "instagram_handle" in body ? body.instagram_handle : rec.instagram_handle;
  const youtube_handle = "youtube_handle" in body ? body.youtube_handle : rec.youtube_handle;
  const x_handle = "x_handle" in body ? body.x_handle : rec.x_handle;
  const threads_handle = "threads_handle" in body ? body.threads_handle : rec.threads_handle;
  const notes = "notes" in body ? body.notes : rec.notes;

  const updated = await sql`
    UPDATE competitors SET
      name = ${name},
      instagram_handle = ${instagram_handle},
      youtube_handle = ${youtube_handle},
      x_handle = ${x_handle},
      threads_handle = ${threads_handle},
      notes = ${notes}
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

  await sql`DELETE FROM competitor_posts WHERE competitor_id = ${id}`;
  await sql`DELETE FROM competitor_snapshots WHERE competitor_id = ${id}`;
  await sql`DELETE FROM competitors WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
