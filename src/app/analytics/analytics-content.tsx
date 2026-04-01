"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";

// ── Types ──────────────────────────────────────────────────────────────────

interface AnalyticsData {
  summary: {
    totalImpressions: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalContent: number;
    followers: number;
    igViews: number;
    ytViews: number;
  };
  timeline: {
    date: string;
    igViews: number;
    ytViews: number;
    igEng: number;
    ytEng: number;
  }[];
  topContent: {
    platform: "instagram" | "youtube";
    title: string;
    type: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    date: string;
    url: string;
    thumbnail: string | null;
  }[];
  contentTypeBreakdown: { type: string; count: number }[];
  topByEngagement: {
    platform: "instagram" | "youtube";
    title: string;
    engagement: number;
  }[];
  topByEngRate: {
    platform: "instagram" | "youtube";
    title: string;
    engagementRate: number;
    views: number;
  }[];
}

type Platform = "all" | "instagram" | "youtube";
type Preset = "7d" | "30d" | "90d" | "all" | "custom";

// ── Colors ─────────────────────────────────────────────────────────────────

const IG_COLOR = "#8b5cf6"; // violet-500
const YT_COLOR = "#ef4444"; // red-500

const PIE_COLORS = ["#8b5cf6", "#ef4444", "#3b82f6", "#f59e0b"];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(240 6% 10%)",
  border: "1px solid hsl(240 4% 20%)",
  borderRadius: "8px",
  color: "hsl(0 0% 90%)",
};

const AXIS_TICK = { fill: "hsl(0 0% 50%)", fontSize: 11 };

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fmtTick(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// ── Component ──────────────────────────────────────────────────────────────

export function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("2020-01-01");
  const [to, setTo] = useState("2026-04-01");
  const [platform, setPlatform] = useState<Platform>("all");

  const [sortKey, setSortKey] = useState<string>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?from=${from}&to=${to}&platform=${platform}`
      );
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [from, to, platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === "7d") {
      setFrom(daysAgo(7));
      setTo("2026-04-01");
    } else if (p === "30d") {
      setFrom(daysAgo(30));
      setTo("2026-04-01");
    } else if (p === "90d") {
      setFrom(daysAgo(90));
      setTo("2026-04-01");
    } else if (p === "all") {
      setFrom("2020-01-01");
      setTo("2026-04-01");
    }
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedContent = data
    ? [...data.topContent].sort((a, b) => {
        const av = a[sortKey as keyof typeof a];
        const bv = b[sortKey as keyof typeof b];
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      })
    : [];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Cross-platform content performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date presets */}
          {(
            [
              ["7d", "7 days"],
              ["30d", "30 days"],
              ["90d", "90 days"],
              ["all", "All Time"],
              ["custom", "Custom"],
            ] as [Preset, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === key
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-muted-foreground hover:bg-zinc-800/50"
              }`}
            >
              {label}
            </button>
          ))}

          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 w-36 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
          )}

          {/* Platform filter */}
          <div className="ml-2 flex rounded-md border border-border">
            {(
              [
                ["all", "All"],
                ["instagram", "Instagram"],
                ["youtube", "YouTube"],
              ] as [Platform, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPlatform(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  platform === key
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-muted-foreground hover:bg-zinc-800/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      ) : !data ? null : (
        <>
          {/* Row 1: Summary stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardInline
              label="Total Impressions"
              value={formatNumber(data.summary.totalImpressions)}
              sub={
                platform === "all"
                  ? `IG ${formatNumber(data.summary.igViews)} / YT ${formatNumber(data.summary.ytViews)}`
                  : undefined
              }
              icon="👁"
            />
            <StatCardInline
              label="Total Engagement"
              value={formatNumber(data.summary.totalEngagement)}
              sub="Likes + Comments"
              icon="💬"
            />
            <StatCardInline
              label="Avg Engagement Rate"
              value={`${data.summary.avgEngagementRate.toFixed(2)}%`}
              sub="Across all content"
              icon="📊"
            />
            <StatCardInline
              label="Total Content"
              value={data.summary.totalContent.toString()}
              sub={
                data.summary.followers > 0
                  ? `${formatNumber(data.summary.followers)} subscribers`
                  : undefined
              }
              icon="📝"
            />
          </div>

          {/* Row 2: Impressions + Engagement charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Impressions Over Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Impressions Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeline}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(0 0% 20%)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtTick}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => Number(v).toLocaleString()}
                    />
                    <Legend />
                    {(platform === "all" || platform === "instagram") && (
                      <Line
                        type="monotone"
                        dataKey="igViews"
                        name="Instagram"
                        stroke={IG_COLOR}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {(platform === "all" || platform === "youtube") && (
                      <Line
                        type="monotone"
                        dataKey="ytViews"
                        name="YouTube"
                        stroke={YT_COLOR}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 15 by Engagement */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Content by Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.topByEngagement}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(0 0% 20%)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={fmtTick}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={120}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => Number(v).toLocaleString()}
                    />
                    <Bar dataKey="engagement" name="Engagement" radius={[0, 4, 4, 0]}>
                      {data.topByEngagement.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.platform === "instagram" ? IG_COLOR : YT_COLOR
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Content Mix + Engagement Rate */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Content Mix Donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Content Mix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.contentTypeBreakdown}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {data.contentTypeBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 10 by Engagement Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Top 10 by Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.topByEngRate}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(0 0% 20%)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      width={120}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => `${Number(v).toFixed(2)}%`}
                    />
                    <Bar
                      dataKey="engagementRate"
                      name="Eng. Rate"
                      radius={[0, 4, 4, 0]}
                    >
                      {data.topByEngRate.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.platform === "instagram" ? IG_COLOR : YT_COLOR
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Top Performing Content Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Top Performing Content
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 pl-4">#</TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <SortableHead
                        label="Views"
                        sortKey="views"
                        currentKey={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHead
                        label="Likes"
                        sortKey="likes"
                        currentKey={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHead
                        label="Comments"
                        sortKey="comments"
                        currentKey={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHead
                        label="Eng. Rate"
                        sortKey="engagementRate"
                        currentKey={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                      <SortableHead
                        label="Date"
                        sortKey="date"
                        currentKey={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContent.map((item, i) => (
                      <TableRow
                        key={`${item.platform}-${item.url}-${i}`}
                        className="cursor-pointer hover:bg-zinc-800/50"
                        onClick={() => window.open(item.url, "_blank")}
                      >
                        <TableCell className="pl-4 text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <span className="text-base">
                            {item.platform === "instagram" ? "📸" : "▶️"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.thumbnail && (
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <span
                              className="max-w-[250px] truncate text-sm"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              item.type === "Reel"
                                ? "bg-violet-500/15 text-violet-400"
                                : item.type === "Carrusel"
                                  ? "bg-blue-500/15 text-blue-400"
                                  : item.type === "Video"
                                    ? "bg-red-500/15 text-red-400"
                                    : "bg-zinc-500/15 text-zinc-400"
                            }`}
                          >
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(item.views)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(item.likes)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(item.comments)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.engagementRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCardInline({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableHead({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  return (
    <TableHead
      className="cursor-pointer select-none text-right"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {currentKey === sortKey && (
          <span className="text-xs">{dir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </TableHead>
  );
}
