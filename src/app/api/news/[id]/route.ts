import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sql = getDb();
  await ensureMigrated();
  const id = parseInt(params.id, 10);
  const body: { read?: boolean; bookmarked?: boolean } = await request.json();

  if (body.read !== undefined) {
    await sql`UPDATE news_items SET read = ${body.read ? 1 : 0} WHERE id = ${id}`;
  }
  if (body.bookmarked !== undefined) {
    await sql`UPDATE news_items SET bookmarked = ${body.bookmarked ? 1 : 0} WHERE id = ${id}`;
  }

  const rows = await sql`SELECT * FROM news_items WHERE id = ${id}` as unknown as Record<string, unknown>[];
  return NextResponse.json(rows[0]);
}
