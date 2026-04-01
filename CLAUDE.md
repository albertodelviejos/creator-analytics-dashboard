# Creator Analytics Dashboard

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via better-sqlite3, WAL mode, file at `db/analytics.db`
- **UI**: shadcn/ui (base-nova style), Tailwind CSS, dark mode always-on
- **Charts**: Recharts
- **Icons**: Lucide React + emoji icons in sidebar
- **Fonts**: Geist Sans + Geist Mono (local woff files)

## Folder Structure
```
src/
  app/
    page.tsx              → Redirects to /analytics
    analytics/            → Cross-platform overview (charts, stats, top content)
    instagram/            → Instagram post manager (grid/table, real data)
    youtube/              → YouTube video analytics (real data)
    calendar/             → Content calendar placeholder
    competitors/          → Competitor tracker placeholder
    news/                 → News consolidator placeholder
    api/
      instagram/          → GET Instagram posts from DB
      youtube/            → GET YouTube videos + channel stats
      sync/[platform]/    → POST triggers fetch scripts
  components/
    Sidebar.tsx           → Collapsible sidebar navigation
    StatCard.tsx          → Metric display card
    SyncButton.tsx        → Platform data sync trigger
    EngagementChart.tsx   → Recharts wrapper (bar/line)
    DataTable.tsx         → Generic sortable table
    PlatformBadge.tsx     → Platform color indicator
    ContentTypeBadge.tsx  → Instagram content type badge
    ui/                   → shadcn/ui primitives
  lib/
    db.ts                 → SQLite singleton + migrations
    format.ts             → formatNumber, formatDate utilities
    utils.ts              → cn() class merge utility
scripts/
  fetch-instagram.ts      → Instagram data fetcher (GraphQL API)
  fetch-youtube.ts        → YouTube Data API v3 fetcher
  cache-thumbnails.py     → Thumbnail caching script
db/
  analytics.db            → SQLite database (gitignored)
```

## Component Conventions
- Server Components by default; `"use client"` only for interactivity
- shadcn/ui components in `src/components/ui/`
- Custom components in `src/components/`
- `cn()` utility for conditional Tailwind classes
- Dark theme always active (class="dark" on html element)

## Data Sources
- **Instagram**: Posts fetched via private GraphQL API using session cookies. Stored in `instagram_posts` table.
- **YouTube**: Videos + channel stats via YouTube Data API v3 (`YOUTUBE_API_KEY`). Stored in `youtube_videos` and `youtube_channel_stats` tables.
- **LinkedIn**: DB schema exists (`linkedin_posts`, `linkedin_profile_stats`) but no data fetcher yet.
- **Competitors**: DB table `competitors` (id, platform, handle, notes, created_at) ready for future use.

## Database Tables
- `instagram_posts` — url (UNIQUE), shortcode, type, caption, published_at, views, likes, comments, engagement_rate
- `youtube_videos` — video_id (UNIQUE), title, description, published_at, views, likes, comments, duration, thumbnail_url
- `youtube_channel_stats` — subscribers, total_views, total_videos, recorded_at
- `linkedin_posts` — placeholder, no data
- `linkedin_profile_stats` — placeholder, no data
- `competitors` — platform, handle, notes, created_at

## Important Decisions
- SQLite chosen for simplicity (single-user local dashboard)
- WAL mode enabled for concurrent read/write
- Data sync is manual (triggered via SyncButton → API → script execution)
- Instagram fetch uses private API with session cookies (fragile, requires valid session)
- Thumbnails cached locally in `public/thumbnails/`
- Home route (/) redirects to /analytics
- Sidebar is collapsible with state managed client-side
