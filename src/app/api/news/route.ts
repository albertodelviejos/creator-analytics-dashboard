import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureMigrated } from "@/lib/db";
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

export async function GET(request: NextRequest) {
  const sql = getDb();
  await ensureMigrated();
  const { searchParams } = request.nextUrl;

  const topic = searchParams.get("topic") || "all";
  const search = searchParams.get("search") || "";
  const bookmarked = searchParams.get("bookmarked");
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const order = sort === "oldest" ? "ASC" : "DESC";

  type Row = Record<string, unknown>;

  // Build query with all optional filters
  let items: Row[];
  let totalRows: Row[];

  if (topic !== "all" && search && bookmarked === "1") {
    items = await sql`SELECT * FROM news_items WHERE topic = ${topic} AND title ILIKE ${"%" + search + "%"} AND bookmarked = 1 ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE topic = ${topic} AND title ILIKE ${"%" + search + "%"} AND bookmarked = 1` as unknown as Row[];
  } else if (topic !== "all" && search) {
    items = await sql`SELECT * FROM news_items WHERE topic = ${topic} AND title ILIKE ${"%" + search + "%"} ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE topic = ${topic} AND title ILIKE ${"%" + search + "%"}` as unknown as Row[];
  } else if (topic !== "all" && bookmarked === "1") {
    items = await sql`SELECT * FROM news_items WHERE topic = ${topic} AND bookmarked = 1 ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE topic = ${topic} AND bookmarked = 1` as unknown as Row[];
  } else if (search && bookmarked === "1") {
    items = await sql`SELECT * FROM news_items WHERE title ILIKE ${"%" + search + "%"} AND bookmarked = 1 ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE title ILIKE ${"%" + search + "%"} AND bookmarked = 1` as unknown as Row[];
  } else if (topic !== "all") {
    items = await sql`SELECT * FROM news_items WHERE topic = ${topic} ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE topic = ${topic}` as unknown as Row[];
  } else if (search) {
    items = await sql`SELECT * FROM news_items WHERE title ILIKE ${"%" + search + "%"} ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE title ILIKE ${"%" + search + "%"}` as unknown as Row[];
  } else if (bookmarked === "1") {
    items = await sql`SELECT * FROM news_items WHERE bookmarked = 1 ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items WHERE bookmarked = 1` as unknown as Row[];
  } else {
    items = await sql`SELECT * FROM news_items ORDER BY published_at ${sql.unsafe(order)} LIMIT ${limit} OFFSET ${offset}` as unknown as Row[];
    totalRows = await sql`SELECT COUNT(*) as count FROM news_items` as unknown as Row[];
  }

  const lastSyncRow = await sql`SELECT MAX(fetched_at) as last_sync FROM news_items` as unknown as Row[];

  const total = (totalRows[0] as { count: string }).count;
  const lastSync = (lastSyncRow[0] as { last_sync: string | null }).last_sync;

  return NextResponse.json({ items, total: parseInt(total, 10), lastSync });
}

export async function POST() {
  const sql = getDb();
  await ensureMigrated();
  const parser = new Parser();

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

        const result = await sql`
          INSERT INTO news_items (guid, title, summary, url, source, topic, image_url, published_at)
          VALUES (${guid}, ${title}, ${summary}, ${link}, ${feed.source}, ${feed.topic}, ${imageUrl}, ${publishedAt})
          ON CONFLICT(guid) DO UPDATE SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            image_url = EXCLUDED.image_url,
            fetched_at = NOW()
          RETURNING id
        ` as unknown as Record<string, unknown>[];
        synced++;
        if (result.length > 0) {
          newItems++;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.source}:`, err);
    }
  }

  return NextResponse.json({ synced, new: newItems });
}
