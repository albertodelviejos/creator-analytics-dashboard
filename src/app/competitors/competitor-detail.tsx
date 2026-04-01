"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { formatNumber, formatDate } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Post {
  id: number;
  platform: string;
  post_id: string;
  title: string | null;
  post_type: string | null;
  url: string | null;
  published_at: string | null;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number | null;
  thumbnail_url: string | null;
}

interface Snapshot {
  id: number;
  platform: string;
  followers: number | null;
  total_posts: number | null;
  recorded_at: string;
}

interface CompetitorDetail {
  id: number;
  name: string;
  instagram_handle: string | null;
  youtube_handle: string | null;
  x_handle: string | null;
  threads_handle: string | null;
  notes: string | null;
  posts: Post[];
  snapshots: Snapshot[];
}

interface CompetitorDetailProps {
  competitorId: number;
}

type SortKey = "published_at" | "views" | "likes" | "comments" | "engagement_rate";

export function CompetitorDetail({ competitorId }: CompetitorDetailProps) {
  const [data, setData] = useState<CompetitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("published_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/competitors/${competitorId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [competitorId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const igSnapshot = data.snapshots.find((s) => s.platform === "instagram");
  const ytSnapshot = data.snapshots.find((s) => s.platform === "youtube");
  const totalPosts = data.posts.length;

  const avgEngagement =
    totalPosts > 0
      ? data.posts.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / totalPosts
      : 0;

  // Posts per week calculation
  const sortedPosts = [...data.posts].sort(
    (a, b) =>
      new Date(a.published_at ?? 0).getTime() -
      new Date(b.published_at ?? 0).getTime()
  );
  let postsPerWeek = 0;
  if (sortedPosts.length >= 2) {
    const firstDate = new Date(sortedPosts[0].published_at ?? 0);
    const lastDate = new Date(sortedPosts[sortedPosts.length - 1].published_at ?? 0);
    const weeks = Math.max(
      1,
      (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    postsPerWeek = sortedPosts.length / weeks;
  }

  // Sort posts for table
  const displayPosts = [...data.posts].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (sortDir === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  // Growth chart data
  const growthData = data.snapshots
    .slice()
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    .reduce(
      (acc, snap) => {
        const date = formatDate(snap.recorded_at);
        const existing = acc.find((d) => d.date === date);
        if (existing) {
          if (snap.platform === "instagram")
            existing.instagram = snap.followers ?? 0;
          if (snap.platform === "youtube")
            existing.youtube = snap.followers ?? 0;
        } else {
          acc.push({
            date,
            instagram: snap.platform === "instagram" ? snap.followers ?? 0 : 0,
            youtube: snap.platform === "youtube" ? snap.followers ?? 0 : 0,
          });
        }
        return acc;
      },
      [] as Array<{ date: string; instagram: number; youtube: number }>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">{data.name}</h3>
        {data.notes && (
          <span className="text-sm text-muted-foreground">{data.notes}</span>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="IG Followers"
          value={
            igSnapshot?.followers ? formatNumber(igSnapshot.followers) : "-"
          }
          icon={
            <Badge
              variant="secondary"
              className="bg-violet-500/15 text-violet-400"
            >
              IG
            </Badge>
          }
        />
        <StatCard
          label="YT Subscribers"
          value={
            ytSnapshot?.followers ? formatNumber(ytSnapshot.followers) : "-"
          }
          icon={
            <Badge variant="secondary" className="bg-red-500/15 text-red-400">
              YT
            </Badge>
          }
        />
        <StatCard
          label="Posts Tracked"
          value={totalPosts}
          icon={<span className="text-2xl">📝</span>}
        />
        <StatCard
          label="Avg Engagement"
          value={avgEngagement > 0 ? `${avgEngagement.toFixed(2)}%` : "-"}
          icon={<span className="text-2xl">📈</span>}
        />
        <StatCard
          label="Posts / Week"
          value={postsPerWeek > 0 ? postsPerWeek.toFixed(1) : "-"}
          icon={<span className="text-2xl">📅</span>}
        />
      </div>

      {/* Growth Chart */}
      {growthData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {data.instagram_handle && (
                  <Line
                    type="monotone"
                    dataKey="instagram"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Instagram"
                  />
                )}
                {data.youtube_handle && (
                  <Line
                    type="monotone"
                    dataKey="youtube"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="YouTube"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Posts Table */}
      {displayPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Platform</TableHead>
                  <TableHead>Title / Caption</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("views")}
                  >
                    Views{sortIndicator("views")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("likes")}
                  >
                    Likes{sortIndicator("likes")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("comments")}
                  >
                    Comments{sortIndicator("comments")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort("engagement_rate")}
                  >
                    Eng. Rate{sortIndicator("engagement_rate")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("published_at")}
                  >
                    Date{sortIndicator("published_at")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPosts.slice(0, 50).map((post) => (
                  <TableRow key={`${post.platform}-${post.post_id}`}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          post.platform === "instagram"
                            ? "bg-violet-500/15 text-violet-400 text-xs"
                            : "bg-red-500/15 text-red-400 text-xs"
                        }
                      >
                        {post.platform === "instagram" ? "IG" : "YT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {post.url ? (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-sm truncate block"
                        >
                          {(post.title || "Untitled").slice(0, 60)}
                        </a>
                      ) : (
                        <span className="text-sm truncate block">
                          {(post.title || "Untitled").slice(0, 60)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {post.post_type && (
                        <Badge variant="outline" className="text-xs">
                          {post.post_type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {formatNumber(post.views)}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {formatNumber(post.likes)}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {formatNumber(post.comments)}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {post.engagement_rate
                        ? `${post.engagement_rate.toFixed(2)}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.published_at ? formatDate(post.published_at) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
