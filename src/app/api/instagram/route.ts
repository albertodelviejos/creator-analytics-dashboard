import { NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  await ensureMigrated();
  const posts = await sql`SELECT * FROM instagram_posts ORDER BY published_at DESC`;
  return NextResponse.json(posts);
}
