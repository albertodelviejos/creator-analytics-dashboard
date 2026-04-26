import { neon } from '@neondatabase/serverless';

export type SqlClient = ReturnType<typeof neon>;
// Convenience cast for neon query results which return a union type
export type Rows = Record<string, unknown>[];
export function rows(result: unknown): Rows {
  return result as Rows;
}

let sql: SqlClient | null = null;
let migrated = false;

export function getDb(): SqlClient {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }
  return sql;
}

export async function ensureMigrated() {
  if (migrated) return;
  const db = getDb();

  await db`
    CREATE TABLE IF NOT EXISTS instagram_posts (
      id SERIAL PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      shortcode TEXT NOT NULL,
      type TEXT CHECK(type IN ('Reel', 'Post', 'Carrusel')),
      caption TEXT,
      published_at TEXT NOT NULL,
      views INTEGER,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      engagement_rate DOUBLE PRECISION,
      thumbnail_url TEXT,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS youtube_videos (
      id SERIAL PRIMARY KEY,
      video_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      published_at TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      duration TEXT,
      thumbnail_url TEXT,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS youtube_channel_stats (
      id SERIAL PRIMARY KEY,
      subscribers INTEGER NOT NULL,
      total_views INTEGER NOT NULL,
      total_videos INTEGER NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS linkedin_posts (
      id SERIAL PRIMARY KEY,
      post_id TEXT UNIQUE,
      content TEXT,
      published_at TEXT,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      engagement_rate DOUBLE PRECISION,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS linkedin_profile_stats (
      id SERIAL PRIMARY KEY,
      followers INTEGER NOT NULL,
      connections INTEGER,
      profile_views INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS competitors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      instagram_handle TEXT,
      youtube_handle TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS x_handle TEXT`;
  await db`ALTER TABLE competitors ADD COLUMN IF NOT EXISTS threads_handle TEXT`;

  await db`
    CREATE TABLE IF NOT EXISTS competitor_posts (
      id SERIAL PRIMARY KEY,
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
      engagement_rate DOUBLE PRECISION,
      thumbnail_url TEXT,
      fetched_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
      UNIQUE(competitor_id, platform, post_id)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS competitor_snapshots (
      id SERIAL PRIMARY KEY,
      competitor_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      followers INTEGER,
      total_posts INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS news_items (
      id SERIAL PRIMARY KEY,
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
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS instagram_content (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS x_posts (
      id SERIAL PRIMARY KEY,
      tweet_id TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      post_type TEXT CHECK(post_type IN ('tweet', 'reply', 'retweet', 'quote', 'thread')) DEFAULT 'tweet',
      published_at TEXT NOT NULL,
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      retweets INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      bookmarks INTEGER DEFAULT 0,
      engagement_rate DOUBLE PRECISION,
      url TEXT,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS x_content (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      text TEXT,
      post_type TEXT CHECK(post_type IN ('tweet', 'thread', 'reply', 'quote')) DEFAULT 'tweet',
      status TEXT CHECK(status IN ('backlog', 'draft', 'scheduled', 'published')) DEFAULT 'backlog',
      scheduled_at TEXT,
      published_at TEXT,
      hashtags TEXT,
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS threads_posts (
      id SERIAL PRIMARY KEY,
      post_id TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      post_type TEXT CHECK(post_type IN ('text', 'image', 'video', 'carousel')) DEFAULT 'text',
      published_at TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      reposts INTEGER DEFAULT 0,
      quotes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      engagement_rate DOUBLE PRECISION,
      url TEXT,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS threads_content (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      text TEXT,
      post_type TEXT CHECK(post_type IN ('text', 'image', 'video', 'carousel')) DEFAULT 'text',
      status TEXT CHECK(status IN ('backlog', 'draft', 'scheduled', 'published')) DEFAULT 'backlog',
      scheduled_at TEXT,
      published_at TEXT,
      hashtags TEXT,
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  migrated = true;
}
