import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return request.json().then((body: { read?: boolean; bookmarked?: boolean }) => {
    const db = getDb();
    const id = parseInt(params.id, 10);

    if (body.read !== undefined) {
      db.prepare("UPDATE news_items SET read = ? WHERE id = ?").run(body.read ? 1 : 0, id);
    }
    if (body.bookmarked !== undefined) {
      db.prepare("UPDATE news_items SET bookmarked = ? WHERE id = ?").run(body.bookmarked ? 1 : 0, id);
    }

    const item = db.prepare("SELECT * FROM news_items WHERE id = ?").get(id);
    return NextResponse.json(item);
  });
}
