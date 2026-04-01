import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "analytics.db");
const API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeVideo {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  thumbnail_url: string;
}

interface ChannelStats {
  subscribers: number;
  total_views: number;
  total_videos: number;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getChannelId(handle: string): Promise<string> {
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${cleanHandle}&key=${API_KEY}`
  );
  if (!data.items?.length) {
    throw new Error(`Channel not found for handle: ${cleanHandle}`);
  }
  return data.items[0].id;
}

async function getChannelStats(channelId: string): Promise<ChannelStats> {
  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${API_KEY}`
  );
  const stats = data.items[0].statistics;
  return {
    subscribers: parseInt(stats.subscriberCount, 10),
    total_views: parseInt(stats.viewCount, 10),
    total_videos: parseInt(stats.videoCount, 10),
  };
}

async function getUploadPlaylistId(channelId: string): Promise<string> {
  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
  );
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getPlaylistVideos(
  playlistId: string,
  maxResults = 30
): Promise<string[]> {
  const data = await fetchJson(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${API_KEY}`
  );
  return data.items.map(
    (item: { contentDetails: { videoId: string } }) =>
      item.contentDetails.videoId
  );
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];

  // YouTube API allows max 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(",")}&key=${API_KEY}`
    );

    for (const item of data.items) {
      videos.push({
        video_id: item.id,
        title: item.snippet.title,
        description: (item.snippet.description || "").slice(0, 500),
        published_at: item.snippet.publishedAt,
        views: parseInt(item.statistics.viewCount || "0", 10),
        likes: parseInt(item.statistics.likeCount || "0", 10),
        comments: parseInt(item.statistics.commentCount || "0", 10),
        duration: parseDuration(item.contentDetails.duration),
        thumbnail_url:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
      });
    }
  }

  return videos;
}

async function main() {
  const handle = process.argv[2];
  if (!handle) {
    console.error("Usage: npx tsx scripts/fetch-youtube.ts <handle>");
    process.exit(1);
  }

  if (!API_KEY) {
    console.error("Error: YOUTUBE_API_KEY not set in environment");
    console.error("Add it to .env.local: YOUTUBE_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log(`Fetching YouTube data for @${handle}...`);

  const channelId = await getChannelId(handle);
  console.log(`Channel ID: ${channelId}`);

  const channelStats = await getChannelStats(channelId);
  console.log(
    `Channel: ${channelStats.subscribers} subs, ${channelStats.total_views} views, ${channelStats.total_videos} videos`
  );

  const uploadsPlaylist = await getUploadPlaylistId(channelId);
  const videoIds = await getPlaylistVideos(uploadsPlaylist, 30);
  console.log(`Found ${videoIds.length} recent videos`);

  const videos = await getVideoDetails(videoIds);

  // Open DB and migrate
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtube_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      published_at TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      duration TEXT,
      thumbnail_url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS youtube_channel_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscribers INTEGER NOT NULL,
      total_views INTEGER NOT NULL,
      total_videos INTEGER NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert channel stats
  db.prepare(
    `INSERT INTO youtube_channel_stats (subscribers, total_views, total_videos)
     VALUES (@subscribers, @total_views, @total_videos)`
  ).run(channelStats);
  console.log("Saved channel stats");

  // Upsert videos
  const upsert = db.prepare(`
    INSERT INTO youtube_videos (video_id, title, description, published_at, views, likes, comments, duration, thumbnail_url, fetched_at)
    VALUES (@video_id, @title, @description, @published_at, @views, @likes, @comments, @duration, @thumbnail_url, CURRENT_TIMESTAMP)
    ON CONFLICT(video_id) DO UPDATE SET
      views = @views,
      likes = @likes,
      comments = @comments,
      fetched_at = CURRENT_TIMESTAMP
  `);

  const insertMany = db.transaction((videos: YouTubeVideo[]) => {
    for (const video of videos) {
      upsert.run(video);
    }
  });

  insertMany(videos);
  console.log(`Saved ${videos.length} videos to database`);
  db.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
