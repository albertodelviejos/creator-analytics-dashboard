import { NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  await ensureMigrated();
  const stats = await sql`SELECT * FROM youtube_channel_stats ORDER BY recorded_at DESC LIMIT 10`;
  return NextResponse.json(stats);
}
