import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";

const FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch", topic: "tools" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge", topic: "tools" },
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", source: "Ars Technica", topic: "tools" },
  { url: "https://openai.com/blog/rss.xml", source: "OpenAI Blog", topic: "research" },
  { url: "https://blog.google/technology/ai/rss/", source: "Google AI Blog", topic: "research" },
  { url: "https://www.anthropic.com/feed.xml", source: "Anthropic", topic: "research" },
  { url: "https://later.com/blog/feed/", source: "Later Blog", topic: "business" },
  { url: "https://blog.hootsuite.com/feed/", source: "Hootsuite", topic: "business" },
  { url: "https://sproutsocial.com/insights/feed/", source: "Sprout Social", topic: "business" },
  { url: "https://www.producthunt.com/feed", source: "Product Hunt", topic: "tools" },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = request.nextUrl;

  const topic = searchParams.get("topic") || "all";
  const search = searchParams.get("search") || "";
  const bookmarked = searchParams.get("bookmarked");
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (topic !== "all") {
    conditions.push("topic = ?");
    params.push(topic);
  }
  if (search) {
    conditions.push("title LIKE ?");
    params.push(`%${search}%`);
  }
  if (bookmarked === "1") {
    conditions.push("bookmarked = 1");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const items = db
    .prepare(`SELECT * FROM news_items ${where} ORDER BY published_at ${order} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM news_items ${where}`)
    .get(...params) as { count: number };

  const lastSync = db
    .prepare("SELECT MAX(fetched_at) as last_sync FROM news_items")
    .get() as { last_sync: string | null };

  return NextResponse.json({
    items,
    total: total.count,
    lastSync: lastSync.last_sync,
  });
}

export async function POST() {
  const db = getDb();
  const parser = new Parser();

  const upsert = db.prepare(`
    INSERT INTO news_items (guid, title, summary, url, source, topic, image_url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guid) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      image_url = excluded.image_url,
      fetched_at = CURRENT_TIMESTAMP
  `);

  let synced = 0;
  let newItems = 0;

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items) {
        const guid = item.guid || item.link || `${feed.source}-${item.title}`;
        const link = item.link || "";
        const title = item.title || "Untitled";
        const rawSummary = item.contentSnippet || item.content || item.summary || "";
        const summary = truncate(stripHtml(rawSummary), 200);
        const imageUrl =
          item.enclosure?.url ||
          (item as Record<string, unknown>)["media:thumbnail"]?.toString() ||
          null;
        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : item.isoDate || null;

        const result = upsert.run(
          guid, title, summary, link, feed.source, feed.topic, imageUrl, publishedAt
        );
        synced++;
        if (result.changes > 0 && result.lastInsertRowid) {
          newItems++;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.source}:`, err);
    }
  }

  return NextResponse.json({ synced, new: newItems });
}
