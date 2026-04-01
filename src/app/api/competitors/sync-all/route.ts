import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const db = getDb();
  const competitors = db
    .prepare("SELECT id, name FROM competitors")
    .all() as Array<{ id: number; name: string }>;

  const results: Array<{ id: number; name: string; success: boolean; error?: string }> = [];

  for (const competitor of competitors) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/competitors/${competitor.id}/sync`,
        { method: "POST" }
      );
      const data = await res.json();
      results.push({ id: competitor.id, name: competitor.name, success: !!data.success, error: data.instagram_error || data.youtube_error });
    } catch (err) {
      results.push({
        id: competitor.id,
        name: competitor.name,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Rate limit delay between competitors
    if (competitors.indexOf(competitor) < competitors.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return NextResponse.json({ results });
}
