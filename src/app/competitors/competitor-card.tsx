"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Competitor } from "./competitors-content";

const BORDER_COLORS = [
  "border-l-violet-500",
  "border-l-red-500",
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-pink-500",
  "border-l-cyan-500",
  "border-l-orange-500",
];

interface CompetitorCardProps {
  competitor: Competitor;
  index: number;
  selected: boolean;
  syncing: boolean;
  onSelect: () => void;
  onSync: () => void;
  onDelete: () => void;
}

export function CompetitorCard({
  competitor,
  index,
  selected,
  syncing,
  onSelect,
  onSync,
  onDelete,
}: CompetitorCardProps) {
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];
  const totalFollowers =
    (competitor.instagram_followers ?? 0) + (competitor.youtube_subscribers ?? 0);
  const totalPosts =
    competitor.instagram_posts_count + competitor.youtube_posts_count;

  return (
    <Card
      className={cn(
        "border-l-4 transition-colors cursor-pointer hover:bg-accent/30",
        borderColor,
        selected && "ring-1 ring-accent-foreground/20 bg-accent/20"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {competitor.name}
            </h3>
            <div className="flex items-center gap-2">
              {competitor.instagram_handle && (
                <Badge
                  variant="secondary"
                  className="bg-violet-500/15 text-violet-400 text-xs"
                >
                  IG
                </Badge>
              )}
              {competitor.youtube_handle && (
                <Badge
                  variant="secondary"
                  className="bg-red-500/15 text-red-400 text-xs"
                >
                  YT
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={syncing}
              onClick={(e) => {
                e.stopPropagation();
                onSync();
              }}
            >
              {syncing ? "Syncing..." : "Sync"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-red-400"
                onClick={(e) => e.stopPropagation()}
              >
                x
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {competitor.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this competitor and all their
                    tracked data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Followers</p>
            <p className="font-semibold font-[family-name:var(--font-geist-mono)]">
              {totalFollowers > 0 ? formatNumber(totalFollowers) : "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Posts Tracked</p>
            <p className="font-semibold font-[family-name:var(--font-geist-mono)]">
              {totalPosts || "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Avg Engagement</p>
            <p className="font-semibold font-[family-name:var(--font-geist-mono)]">
              {competitor.avg_engagement
                ? `${competitor.avg_engagement.toFixed(2)}%`
                : "-"}
            </p>
          </div>
        </div>

        {competitor.last_synced && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last synced {formatDate(competitor.last_synced)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
