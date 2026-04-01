import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  const posts = db
    .prepare(
      "SELECT * FROM instagram_posts ORDER BY published_at DESC"
    )
    .all();
  return NextResponse.json(posts);
}
