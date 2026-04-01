"use client";

import { useState } from "react";
import { EngagementChart } from "@/components/EngagementChart";
import { DataTable, Column } from "@/components/DataTable";
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
}

interface InstagramContentProps {
  posts: InstagramPost[];
}

const columns: Column<InstagramPost>[] = [
  {
    key: "published_at",
    header: "Date",
    sortable: true,
    render: (row) => (
      <span className="text-sm">{formatDate(row.published_at)}</span>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (row) => <ContentTypeBadge type={row.type} />,
  },
  {
    key: "caption",
    header: "Caption",
    render: (row) => (
      <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
        {row.caption || "-"}
      </span>
    ),
  },
  {
    key: "views",
    header: "Views",
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm">
        {row.views != null ? formatNumber(row.views) : "-"}
      </span>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm">{formatNumber(row.likes)}</span>
    ),
  },
  {
    key: "comments",
    header: "Comments",
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm">{formatNumber(row.comments)}</span>
    ),
  },
  {
    key: "engagement_rate",
    header: "Engagement",
    sortable: true,
    render: (row) => (
      <span className="font-mono text-sm">
        {row.engagement_rate != null
          ? `${row.engagement_rate.toFixed(2)}%`
          : "-"}
      </span>
    ),
  },
];

export function InstagramContent({ posts }: InstagramContentProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
        <SyncButton platform="instagram" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
