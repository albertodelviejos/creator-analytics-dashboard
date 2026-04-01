import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "analytics.db");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
const X_IG_APP_ID = "936619743392459";
const LSD_TOKEN = "AVqbxe3J_YA";

interface InstagramPost {
  shortcode: string;
  type: "Reel" | "Post" | "Carrusel";
  caption: string;
  published_at: string;
  views: number | null;
  likes: number;
  comments: number;
  url: string;
}

function mapTypename(typename: string, productType?: string): "Reel" | "Post" | "Carrusel" {
  if (typename === "GraphSidecar") return "Carrusel";
  if (typename === "GraphVideo" || productType === "clips") return "Reel";
  return "Post";
}

async function fetchUserPosts(username: string): Promise<InstagramPost[]> {
  // First get user ID via web profile info
  const profileUrl = new URL("https://www.instagram.com/api/graphql");
  profileUrl.searchParams.set(
    "variables",
    JSON.stringify({ username, render_surface: "PROFILE" })
  );
  profileUrl.searchParams.set("doc_id", "7842794569160958");
  profileUrl.searchParams.set("lsd", LSD_TOKEN);

  const profileRes = await fetch(profileUrl, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-IG-App-ID": X_IG_APP_ID,
      "X-FB-LSD": LSD_TOKEN,
      "X-ASBD-ID": "129477",
      "Sec-Fetch-Site": "same-origin",
    },
  });

  if (!profileRes.ok) {
    throw new Error(`Profile fetch failed: ${profileRes.status}`);
  }

  const profileData = await profileRes.json();
  const user = profileData?.data?.user;

  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  const edges =
    user?.edge_owner_to_timeline_media?.edges ||
    user?.edge_felix_video_timeline?.edges ||
    [];

  const posts: InstagramPost[] = [];

  for (const edge of edges) {
    const node = edge.node;
    const shortcode = node.shortcode;

    // Fetch detailed data per post
    try {
      const detail = await fetchPostDetail(shortcode);
      posts.push(detail);
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  Skipping ${shortcode}: ${(err as Error).message}`);
    }
  }

  return posts;
}

async function fetchPostDetail(shortcode: string): Promise<InstagramPost> {
  const graphql = new URL("https://www.instagram.com/api/graphql");
  graphql.searchParams.set(
    "variables",
    JSON.stringify({ shortcode })
  );
  graphql.searchParams.set("doc_id", "10015901848480474");
  graphql.searchParams.set("lsd", LSD_TOKEN);

  const response = await fetch(graphql, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-IG-App-ID": X_IG_APP_ID,
      "X-FB-LSD": LSD_TOKEN,
      "X-ASBD-ID": "129477",
      "Sec-Fetch-Site": "same-origin",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();
  const item = json?.data?.xdt_shortcode_media;

  if (!item) {
    throw new Error("No data returned");
  }

  const typename = item.__typename as string;
  const productType = item.product_type as string | undefined;
  const type = mapTypename(typename, productType);

  const caption =
    item.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 150) || "";

  const views =
    item.video_play_count || item.video_view_count || null;

  const likes = item.edge_media_preview_like?.count || 0;
  const comments = item.edge_media_to_parent_comment?.count || 0;

  const timestamp = item.taken_at_timestamp;
  const published_at = new Date(timestamp * 1000).toISOString();

  return {
    shortcode,
    type,
    caption,
    published_at,
    views,
    likes,
    comments,
    url: `https://www.instagram.com/p/${shortcode}/`,
  };
}

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: npx tsx scripts/fetch-instagram.ts <username>");
    process.exit(1);
  }

  console.log(`Fetching Instagram posts for @${username}...`);

  const posts = await fetchUserPosts(username);
  console.log(`Found ${posts.length} posts`);

  // Open DB and migrate
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS instagram_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      shortcode TEXT NOT NULL,
      type TEXT CHECK(type IN ('Reel', 'Post', 'Carrusel')),
      caption TEXT,
      published_at TEXT NOT NULL,
      views INTEGER,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      engagement_rate REAL,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const upsert = db.prepare(`
    INSERT INTO instagram_posts (url, shortcode, type, caption, published_at, views, likes, comments, engagement_rate, fetched_at)
    VALUES (@url, @shortcode, @type, @caption, @published_at, @views, @likes, @comments, @engagement_rate, CURRENT_TIMESTAMP)
    ON CONFLICT(url) DO UPDATE SET
      views = @views,
      likes = @likes,
      comments = @comments,
      engagement_rate = @engagement_rate,
      fetched_at = CURRENT_TIMESTAMP
  `);

  const insertMany = db.transaction((posts: InstagramPost[]) => {
    for (const post of posts) {
      const totalInteractions = post.likes + post.comments;
      const engagementRate = post.views
        ? (totalInteractions / post.views) * 100
        : null;

      upsert.run({
        url: post.url,
        shortcode: post.shortcode,
        type: post.type,
        caption: post.caption,
        published_at: post.published_at,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        engagement_rate: engagementRate,
      });
    }
  });

  insertMany(posts);
  console.log(`Saved ${posts.length} posts to database`);
  db.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
