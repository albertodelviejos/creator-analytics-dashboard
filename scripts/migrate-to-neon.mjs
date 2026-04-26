import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const envFile = readFileSync(path.join(projectRoot, '.env.local'), 'utf8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^(\w+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const sql = neon(envVars.DATABASE_URL);
const sqlite = new Database(path.join(projectRoot, 'db', 'analytics.db'));

const tables = [
  `CREATE TABLE IF NOT EXISTS instagram_posts (
    id SERIAL PRIMARY KEY, url TEXT UNIQUE NOT NULL, shortcode TEXT NOT NULL,
    type TEXT, caption TEXT, published_at TEXT NOT NULL, views INTEGER,
    likes INTEGER NOT NULL DEFAULT 0, comments INTEGER NOT NULL DEFAULT 0,
    engagement_rate DOUBLE PRECISION, thumbnail_url TEXT, fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS youtube_videos (
    id SERIAL PRIMARY KEY, video_id TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
    description TEXT, published_at TEXT NOT NULL, views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, duration TEXT,
    thumbnail_url TEXT, fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS youtube_channel_stats (
    id SERIAL PRIMARY KEY, subscribers INTEGER NOT NULL, total_views INTEGER NOT NULL,
    total_videos INTEGER NOT NULL, recorded_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS linkedin_posts (
    id SERIAL PRIMARY KEY, post_id TEXT UNIQUE, content TEXT, published_at TEXT,
    impressions INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0, likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0, shares INTEGER DEFAULT 0, engagement_rate DOUBLE PRECISION,
    fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS linkedin_profile_stats (
    id SERIAL PRIMARY KEY, followers INTEGER NOT NULL, connections INTEGER,
    profile_views INTEGER, recorded_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, instagram_handle TEXT, youtube_handle TEXT,
    x_handle TEXT, threads_handle TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS competitor_posts (
    id SERIAL PRIMARY KEY, competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, post_id TEXT NOT NULL, title TEXT, post_type TEXT, url TEXT,
    published_at TEXT, views INTEGER DEFAULT 0, likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0,
    engagement_rate DOUBLE PRECISION, thumbnail_url TEXT, fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competitor_id, platform, post_id))`,
  `CREATE TABLE IF NOT EXISTS competitor_snapshots (
    id SERIAL PRIMARY KEY, competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, followers INTEGER, total_posts INTEGER, recorded_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS news_items (
    id SERIAL PRIMARY KEY, guid TEXT UNIQUE NOT NULL, title TEXT NOT NULL, summary TEXT,
    url TEXT NOT NULL, source TEXT NOT NULL, topic TEXT DEFAULT 'tools', image_url TEXT,
    published_at TEXT, read INTEGER DEFAULT 0, bookmarked INTEGER DEFAULT 0,
    fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS instagram_content (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, caption TEXT, post_type TEXT DEFAULT 'Post',
    status TEXT DEFAULT 'backlog', scheduled_at TEXT, published_at TEXT, media_url TEXT,
    hashtags TEXT, notes TEXT, priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS x_posts (
    id SERIAL PRIMARY KEY, tweet_id TEXT UNIQUE NOT NULL, text TEXT NOT NULL,
    post_type TEXT DEFAULT 'tweet', published_at TEXT NOT NULL, impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0, retweets INTEGER DEFAULT 0, replies INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0, engagement_rate DOUBLE PRECISION, url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS x_content (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, text TEXT, post_type TEXT DEFAULT 'tweet',
    status TEXT DEFAULT 'backlog', scheduled_at TEXT, published_at TEXT, hashtags TEXT,
    notes TEXT, priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS threads_posts (
    id SERIAL PRIMARY KEY, post_id TEXT UNIQUE NOT NULL, text TEXT NOT NULL,
    post_type TEXT DEFAULT 'text', published_at TEXT NOT NULL, likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0, reposts INTEGER DEFAULT 0, quotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0, engagement_rate DOUBLE PRECISION, url TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS threads_content (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, text TEXT, post_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'backlog', scheduled_at TEXT, published_at TEXT, hashtags TEXT,
    notes TEXT, priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`
];

async function run() {
  // Create tables
  for (const ddl of tables) {
    await sql.query(ddl);
    const name = ddl.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    console.log(`✓ Table: ${name}`);
  }

  // Migrate data from SQLite
  const dataTables = [
    { name: 'instagram_posts', cols: 'url,shortcode,type,caption,published_at,views,likes,comments,engagement_rate,thumbnail_url' },
    { name: 'youtube_videos', cols: 'video_id,title,description,published_at,views,likes,comments,duration,thumbnail_url' },
    { name: 'youtube_channel_stats', cols: 'subscribers,total_views,total_videos' },
    { name: 'news_items', cols: 'guid,title,summary,url,source,topic,image_url,published_at,read,bookmarked' },
    { name: 'instagram_content', cols: 'title,caption,post_type,status,scheduled_at,published_at,media_url,hashtags,notes,priority' },
    { name: 'x_posts', cols: 'tweet_id,text,post_type,published_at,impressions,likes,retweets,replies,bookmarks,engagement_rate,url' },
    { name: 'x_content', cols: 'title,text,post_type,status,scheduled_at,published_at,hashtags,notes,priority' },
    { name: 'threads_posts', cols: 'post_id,text,post_type,published_at,likes,replies,reposts,quotes,views,engagement_rate,url' },
    { name: 'threads_content', cols: 'title,text,post_type,status,scheduled_at,published_at,hashtags,notes,priority' },
    { name: 'competitors', cols: 'name,instagram_handle,youtube_handle,x_handle,threads_handle,notes' },
  ];

  for (const { name, cols } of dataTables) {
    try {
      const rows = sqlite.prepare(`SELECT ${cols} FROM ${name}`).all();
      if (rows.length === 0) {
        console.log(`  ${name}: 0 rows (empty)`);
        continue;
      }

      const colArr = cols.split(',');
      let inserted = 0;
      for (const row of rows) {
        const values = colArr.map(c => row[c] ?? null);
        const placeholders = colArr.map((_, i) => `$${i + 1}`).join(',');
        try {
          await sql.query(
            `INSERT INTO ${name} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (e) {
          // skip duplicates
        }
      }
      console.log(`  ${name}: ${inserted}/${rows.length} rows migrated`);
    } catch (e) {
      console.log(`  ${name}: skipped (${e.message})`);
    }
  }

  // Migrate competitor-dependent tables after competitors
  const depTables = [
    { name: 'competitor_posts', cols: 'competitor_id,platform,post_id,title,post_type,url,published_at,views,likes,comments,engagement_rate,thumbnail_url' },
    { name: 'competitor_snapshots', cols: 'competitor_id,platform,followers,total_posts' },
  ];

  for (const { name, cols } of depTables) {
    try {
      const rows = sqlite.prepare(`SELECT ${cols} FROM ${name}`).all();
      const colArr = cols.split(',');
      let inserted = 0;
      for (const row of rows) {
        const values = colArr.map(c => row[c] ?? null);
        const placeholders = colArr.map((_, i) => `$${i + 1}`).join(',');
        try {
          await sql.query(
            `INSERT INTO ${name} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (e) {}
      }
      console.log(`  ${name}: ${inserted}/${rows.length} rows migrated`);
    } catch (e) {
      console.log(`  ${name}: skipped (${e.message})`);
    }
  }

  console.log('\n✅ Migration complete!');
}

run().catch(e => { console.error(e); process.exit(1); });
