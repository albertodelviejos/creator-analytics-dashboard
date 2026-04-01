import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  const stats = db
    .prepare(
      "SELECT * FROM youtube_channel_stats ORDER BY recorded_at DESC LIMIT 10"
    )
    .all();
  return NextResponse.json(stats);
}
