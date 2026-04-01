export const dynamic = "force-dynamic";

import { getDb } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { InstagramContent } from "./instagram-content";

interface InstagramPost {
  id: number;
  url: string;
  shortcode: string;
  type: "Reel" | "Post" | "Carrusel";
  caption: string | null;
  published_at: string;
  views: number | null;
  likes: number;
  comments: number;
  engagement_rate: number | null;
  thumbnail_url: string | null;
}

function getData() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM instagram_posts ORDER BY published_at DESC")
    .all() as InstagramPost[];
}

export default function InstagramPage() {
  const posts = getData();

  const totalPosts = posts.length;
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalViews = posts.reduce((s, p) => s + (p.views ?? 0), 0);
  const avgEngagement =
    posts.length > 0
      ? posts.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / posts.length
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Instagram</h2>
          <p className="text-muted-foreground">Post performance analytics</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Posts"
          value={totalPosts}
          icon={<span className="text-2xl">📝</span>}
        />
        <StatCard
          label="Avg Engagement"
          value={`${avgEngagement.toFixed(2)}%`}
          icon={<span className="text-2xl">📈</span>}
        />
        <StatCard
          label="Total Likes"
          value={formatNumber(totalLikes)}
          icon={<span className="text-2xl">❤️</span>}
        />
        <StatCard
          label="Total Views"
          value={formatNumber(totalViews)}
          icon={<span className="text-2xl">👁️</span>}
        />
      </div>

      <InstagramContent posts={posts} />
    </div>
  );
}
