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
  `);
}
