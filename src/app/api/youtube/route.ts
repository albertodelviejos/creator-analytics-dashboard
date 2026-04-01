import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  const videos = db
    .prepare(
      "SELECT * FROM youtube_videos ORDER BY published_at DESC"
    )
    .all();
  return NextResponse.json(videos);
}
