"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatNumber } from "@/lib/format";
import { CompetitorCard } from "./competitor-card";
import { CompetitorDetail } from "./competitor-detail";
import { AddCompetitorModal } from "./add-competitor-modal";

export interface Competitor {
  id: number;
  name: string;
  instagram_handle: string | null;
  youtube_handle: string | null;
  notes: string | null;
  created_at: string;
  instagram_followers: number | null;
  youtube_subscribers: number | null;
  instagram_posts_count: number;
  youtube_posts_count: number;
  avg_engagement: number | null;
  last_synced: string | null;
}

interface OwnStats {
  ig_followers: number | null;
  yt_subscribers: number | null;
  ig_posts: number;
  yt_posts: number;
  avg_engagement: number | null;
}

type CompSortKey =
  | "name"
  | "ig_followers"
  | "yt_subscribers"
  | "total_posts"
  | "avg_engagement";

export function CompetitorsContent() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [ownStats, setOwnStats] = useState<OwnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [compSortKey, setCompSortKey] = useState<CompSortKey>("ig_followers");
  const [compSortDir, setCompSortDir] = useState<"asc" | "desc">("desc");

  const fetchCompetitors = useCallback(async () => {
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      setCompetitors(data);
    } catch {
      toast.error("Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwnStats = useCallback(async () => {
    try {
      const [igRes, ytRes, ytChRes] = await Promise.all([
        fetch("/api/instagram"),
        fetch("/api/youtube"),
        fetch("/api/youtube/channel"),
      ]);
      const igPosts = await igRes.json();
      const ytVideos = await ytRes.json();
      const ytChannelStats = await ytChRes.json();

      const igPostsArr = Array.isArray(igPosts) ? igPosts : [];
      const ytVideosArr = Array.isArray(ytVideos) ? ytVideos : [];
      const latestChannel = Array.isArray(ytChannelStats) ? ytChannelStats[0] : null;

      const igAvg =
        igPostsArr.length > 0
          ? igPostsArr.reduce(
              (s: number, p: { engagement_rate: number | null }) =>
                s + (p.engagement_rate ?? 0),
              0
            ) / igPostsArr.length
          : 0;

      setOwnStats({
        ig_followers: null,
        yt_subscribers: latestChannel?.subscribers ?? null,
        ig_posts: igPostsArr.length,
        yt_posts: ytVideosArr.length,
        avg_engagement: igAvg > 0 ? igAvg : null,
      });
    } catch {
      // Non-critical, ignore
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
    fetchOwnStats();
  }, [fetchCompetitors, fetchOwnStats]);

  async function handleSync(id: number) {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/competitors/${id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sync completed");
        fetchCompetitors();
      } else {
        toast.error(
          data.instagram_error || data.youtube_error || "Sync failed"
        );
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/competitors/sync-all", { method: "POST" });
      const data = await res.json();
      const failed = data.results?.filter(
        (r: { success: boolean }) => !r.success
      );
      if (failed?.length > 0) {
        toast.warning(
          `Synced with ${failed.length} error(s)`
        );
      } else {
        toast.success("All competitors synced");
      }
      fetchCompetitors();
    } catch {
      toast.error("Sync all failed");
    } finally {
      setSyncingAll(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      toast.success("Competitor deleted");
      if (selectedId === id) setSelectedId(null);
      fetchCompetitors();
    } catch {
      toast.error("Failed to delete");
    }
  }

  function handleCompSort(key: CompSortKey) {
    if (compSortKey === key) {
      setCompSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCompSortKey(key);
      setCompSortDir("desc");
    }
  }

  const compSortIndicator = (key: CompSortKey) =>
    compSortKey === key ? (compSortDir === "asc" ? " ↑" : " ↓") : "";

  // Build comparison rows
  type CompRow = {
    name: string;
    isYou: boolean;
    ig_followers: number | null;
    yt_subscribers: number | null;
    total_posts: number;
    avg_engagement: number | null;
    last_synced: string | null;
  };

  const compRows: CompRow[] = competitors.map((c) => ({
    name: c.name,
    isYou: false,
    ig_followers: c.instagram_followers,
    yt_subscribers: c.youtube_subscribers,
    total_posts: c.instagram_posts_count + c.youtube_posts_count,
    avg_engagement: c.avg_engagement,
    last_synced: c.last_synced,
  }));

  if (ownStats) {
    compRows.unshift({
      name: "You (Alberto)",
      isYou: true,
      ig_followers: ownStats.ig_followers,
      yt_subscribers: ownStats.yt_subscribers,
      total_posts: ownStats.ig_posts + ownStats.yt_posts,
      avg_engagement: ownStats.avg_engagement,
      last_synced: null,
    });
  }

  compRows.sort((a, b) => {
    let aVal: number | string | null;
    let bVal: number | string | null;
    switch (compSortKey) {
      case "name":
        aVal = a.name;
        bVal = b.name;
        break;
      case "ig_followers":
        aVal = a.ig_followers;
        bVal = b.ig_followers;
        break;
      case "yt_subscribers":
        aVal = a.yt_subscribers;
        bVal = b.yt_subscribers;
        break;
      case "total_posts":
        aVal = a.total_posts;
        bVal = b.total_posts;
        break;
      case "avg_engagement":
        aVal = a.avg_engagement;
        bVal = b.avg_engagement;
        break;
      default:
        return 0;
    }
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (compSortDir === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Competitor Tracker
          </h2>
          <p className="text-muted-foreground">
            Monitor competitor performance across platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={syncingAll || competitors.length === 0}
          >
            {syncingAll ? "Syncing All..." : "Sync All"}
          </Button>
          <Button onClick={() => setModalOpen(true)}>+ Add Competitor</Button>
        </div>
      </div>

      {/* Competitor Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              No competitors added yet. Click &ldquo;Add Competitor&rdquo; to get
              started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {competitors.map((c, i) => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              index={i}
              selected={selectedId === c.id}
              syncing={syncingId === c.id}
              onSelect={() =>
                setSelectedId((prev) => (prev === c.id ? null : c.id))
              }
              onSync={() => handleSync(c.id)}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      {/* Detail Section */}
      {selectedId && (
        <div className="border-t border-border pt-6">
          <CompetitorDetail competitorId={selectedId} />
        </div>
      )}

      {/* Comparison Table */}
      {compRows.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleCompSort("name")}
                  >
                    Name{compSortIndicator("name")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleCompSort("ig_followers")}
                  >
                    IG Followers{compSortIndicator("ig_followers")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleCompSort("yt_subscribers")}
                  >
                    YT Subscribers{compSortIndicator("yt_subscribers")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleCompSort("total_posts")}
                  >
                    Total Posts{compSortIndicator("total_posts")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleCompSort("avg_engagement")}
                  >
                    Avg Engagement{compSortIndicator("avg_engagement")}
                  </TableHead>
                  <TableHead>Last Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compRows.map((row) => (
                  <TableRow
                    key={row.name}
                    className={row.isYou ? "bg-accent/30" : ""}
                  >
                    <TableCell className="font-medium">
                      {row.name}
                      {row.isYou && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {row.ig_followers != null
                        ? formatNumber(row.ig_followers)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {row.yt_subscribers != null
                        ? formatNumber(row.yt_subscribers)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {row.total_posts || "-"}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-geist-mono)] text-sm">
                      {row.avg_engagement
                        ? `${row.avg_engagement.toFixed(2)}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.last_synced
                        ? new Date(row.last_synced).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Modal */}
      <AddCompetitorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSaved={fetchCompetitors}
      />
    </div>
  );
}
