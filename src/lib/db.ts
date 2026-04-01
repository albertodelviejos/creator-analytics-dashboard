import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "analytics.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
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
      thumbnail_url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS linkedin_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT UNIQUE,
      content TEXT,
      published_at TEXT,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      engagement_rate REAL,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linkedin_profile_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followers INTEGER NOT NULL,
      connections INTEGER,
      profile_views INTEGER,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      instagram_handle TEXT,
      youtube_handle TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('instagram', 'youtube')),
      post_id TEXT NOT NULL,
      title TEXT,
      post_type TEXT,
      url TEXT,
      published_at TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      engagement_rate REAL,
      thumbnail_url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
      UNIQUE(competitor_id, platform, post_id)
    );

    CREATE TABLE IF NOT EXISTS competitor_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      followers INTEGER,
      total_posts INTEGER,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guid TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      url TEXT NOT NULL,
      source TEXT NOT NULL,
      topic TEXT CHECK(topic IN ('tools', 'research', 'business')) DEFAULT 'tools',
      image_url TEXT,
      published_at TEXT,
      read INTEGER DEFAULT 0,
      bookmarked INTEGER DEFAULT 0,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS instagram_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      caption TEXT,
      post_type TEXT CHECK(post_type IN ('Reel', 'Post', 'Carrusel', 'Story')) DEFAULT 'Post',
      status TEXT CHECK(status IN ('backlog', 'draft', 'scheduled', 'published')) DEFAULT 'backlog',
      scheduled_at TEXT,
      published_at TEXT,
      media_url TEXT,
      hashtags TEXT,
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS x_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      post_type TEXT CHECK(post_type IN ('tweet', 'reply', 'retweet', 'quote', 'thread')) DEFAULT 'tweet',
      published_at TEXT NOT NULL,
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      retweets INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      bookmarks INTEGER DEFAULT 0,
      engagement_rate REAL,
      url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS x_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT,
      post_type TEXT CHECK(post_type IN ('tweet', 'thread', 'reply', 'quote')) DEFAULT 'tweet',
      status TEXT CHECK(status IN ('backlog', 'draft', 'scheduled', 'published')) DEFAULT 'backlog',
      scheduled_at TEXT,
      published_at TEXT,
      hashtags TEXT,
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS threads_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      post_type TEXT CHECK(post_type IN ('text', 'image', 'video', 'carousel')) DEFAULT 'text',
      published_at TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      reposts INTEGER DEFAULT 0,
      quotes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      engagement_rate REAL,
      url TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS threads_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT,
      post_type TEXT CHECK(post_type IN ('text', 'image', 'video', 'carousel')) DEFAULT 'text',
      status TEXT CHECK(status IN ('backlog', 'draft', 'scheduled', 'published')) DEFAULT 'backlog',
      scheduled_at TEXT,
      published_at TEXT,
      hashtags TEXT,
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add x_handle and threads_handle columns to competitors if they don't exist
  const competitorCols = db.prepare("PRAGMA table_info(competitors)").all() as Array<{ name: string }>;
  const colNames = competitorCols.map((c) => c.name);
  if (!colNames.includes("x_handle")) {
    db.exec("ALTER TABLE competitors ADD COLUMN x_handle TEXT");
  }
  if (!colNames.includes("threads_handle")) {
    db.exec("ALTER TABLE competitors ADD COLUMN threads_handle TEXT");
  }
}
