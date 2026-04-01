"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard, type NewsItem } from "./news-card";

type Topic = "all" | "tools" | "research" | "business";

const TOPIC_FILTERS: { value: Topic; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tools", label: "🛠 Tools" },
  { value: "research", label: "🔬 Research" },
  { value: "business", label: "💼 Business" },
];

const TOPIC_ACTIVE_COLORS: Record<Topic, string> = {
  all: "bg-zinc-700 text-zinc-100",
  tools: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  research: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  business: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function NewsContent() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [topic, setTopic] = useState<Topic>("all");
  const [search, setSearch] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const fetchItems = useCallback(
    async (offset = 0, append = false) => {
      const params = new URLSearchParams();
      if (topic !== "all") params.set("topic", topic);
      if (search) params.set("search", search);
      if (bookmarkedOnly) params.set("bookmarked", "1");
      params.set("sort", sort);
      params.set("limit", "20");
      params.set("offset", String(offset));

      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();

      if (append) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setTotal(data.total);
      setLastSync(data.lastSync);
    },
    [topic, search, bookmarkedOnly, sort]
  );

  useEffect(() => {
    setLoading(true);
    fetchItems(0).finally(() => setLoading(false));
  }, [fetchItems]);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/news", { method: "POST" });
      await fetchItems(0);
    } finally {
      setSyncing(false);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await fetchItems(items.length, true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleBookmark(id: number, bookmarked: boolean) {
    await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarked }),
    });
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, bookmarked: bookmarked ? 1 : 0 } : item
      )
    );
  }

  async function handleMarkRead(id: number) {
    await fetch(`/api/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: 1 } : item
      )
    );
  }

  function formatLastSync(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">News Feed</h2>
          <p className="text-sm text-muted-foreground">
            {total} articles
            {lastSync && <> &middot; Last synced {formatLastSync(lastSync)}</>}
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          size="sm"
          className="gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? "Syncing…" : "Sync Feeds"}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Topic pills */}
        <div className="flex gap-1.5">
          {TOPIC_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTopic(t.value)}
              className={cn(
                "rounded-full border border-zinc-800 px-3 py-1 text-xs font-medium transition-colors",
                topic === t.value
                  ? TOPIC_ACTIVE_COLORS[t.value]
                  : "text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Bookmarked toggle */}
        <button
          onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            bookmarkedOnly
              ? "border-amber-500/30 bg-amber-500/20 text-amber-400"
              : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Star className="h-3 w-3" fill={bookmarkedOnly ? "currentColor" : "none"} />
          Bookmarked
        </button>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400 outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <span className="text-3xl">📰</span>
          </div>
          <div>
            <p className="text-lg font-medium text-zinc-400">No articles found</p>
            <p className="mt-1 text-sm text-zinc-600">
              {total === 0
                ? 'Click "Sync Feeds" to fetch the latest news'
                : "Try adjusting your filters"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onToggleBookmark={handleToggleBookmark}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>

          {items.length < total && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {loadingMore ? "Loading…" : `Load more (${total - items.length} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
