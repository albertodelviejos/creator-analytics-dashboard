"use client";

import { useState } from "react";
import { EngagementChart } from "@/components/EngagementChart";
import { ContentTypeBadge } from "@/components/ContentTypeBadge";
import { SyncButton } from "@/components/SyncButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber, formatDate } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface InstagramContentProps {
  posts: InstagramPost[];
}

function PostCard({ post }: { post: InstagramPost }) {
  const [imgError, setImgError] = useState(false);
  const initial = post.shortcode[0]?.toUpperCase() || "?";

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {post.thumbnail_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt={post.caption || post.shortcode}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
            {initial}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <ContentTypeBadge type={post.type} />
        </div>

        {/* Views badge (if video) */}
        {post.views != null && post.views > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <span className="text-white font-bold text-xs">
              {formatNumber(post.views)}
            </span>
            <span className="text-zinc-400 text-[10px] ml-1">views</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-4 text-white text-sm font-medium">
            <span>❤️ {formatNumber(post.likes)}</span>
            <span>💬 {formatNumber(post.comments)}</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2rem]">
          {post.caption || "Sin caption"}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
          <span>{formatDate(post.published_at)}</span>
          {post.engagement_rate != null && (
            <span
              className={`font-medium ${
                post.engagement_rate >= 5
                  ? "text-emerald-500"
                  : post.engagement_rate >= 2
                  ? "text-amber-500"
                  : "text-muted-foreground"
              }`}
            >
              {post.engagement_rate.toFixed(1)}% eng
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function InstagramContent({ posts }: InstagramContentProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<string>("grid");

  const filtered =
    typeFilter === "all"
      ? posts
      : posts.filter((p) => p.type === typeFilter);

  const chartPosts = filtered.slice(0, 20).reverse();
  const chartData = chartPosts.map((p) => ({
    label: p.shortcode.slice(0, 8),
    views: p.views ?? 0,
    likes: p.likes,
  }));

  return (
    <div className="space-y-6">
      <EngagementChart
        title="Views & Likes by Post (Last 20)"
        data={chartData}
        series={[
          { key: "views", name: "Views", color: "#8b5cf6" },
          { key: "likes", name: "Likes", color: "#ec4899" },
        ]}
        type="bar"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Posts</h3>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Reel">Reel</SelectItem>
              <SelectItem value="Post">Post</SelectItem>
              <SelectItem value="Carrusel">Carrusel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs px-3">
                Grid
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs px-3">
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <SyncButton platform="instagram" />
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Preview</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Caption</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Views</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Likes</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Comments</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Eng.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <TableRow key={post.id} post={post} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TableRow({ post }: { post: InstagramPost }) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-2">
        <a href={post.url} target="_blank" rel="noopener noreferrer">
          {post.thumbnail_url && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail_url}
              alt=""
              className="w-12 h-12 rounded-md object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
              📷
            </div>
          )}
        </a>
      </td>
      <td className="p-3 whitespace-nowrap">{formatDate(post.published_at)}</td>
      <td className="p-3">
        <ContentTypeBadge type={post.type} />
      </td>
      <td className="p-3">
        <span className="max-w-[200px] truncate block text-muted-foreground">
          {post.caption || "-"}
        </span>
      </td>
      <td className="p-3 text-right font-mono">
        {post.views != null ? formatNumber(post.views) : "-"}
      </td>
      <td className="p-3 text-right font-mono">{formatNumber(post.likes)}</td>
      <td className="p-3 text-right font-mono">{formatNumber(post.comments)}</td>
      <td className="p-3 text-right font-mono">
        {post.engagement_rate != null
          ? `${post.engagement_rate.toFixed(1)}%`
          : "-"}
      </td>
    </tr>
  );
}
