"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface NewsItem {
  id: number;
  guid: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  topic: "tools" | "research" | "business";
  image_url: string | null;
  published_at: string | null;
  read: number;
  bookmarked: number;
  fetched_at: string;
}

const TOPIC_COLORS = {
  tools: "bg-blue-500/20 text-blue-400",
  research: "bg-violet-500/20 text-violet-400",
  business: "bg-amber-500/20 text-amber-400",
} as const;

const TOPIC_LABELS = {
  tools: "🛠 Tools",
  research: "🔬 Research",
  business: "💼 Business",
} as const;

const TOPIC_GRADIENTS = {
  tools: "from-blue-600/30 to-blue-900/30",
  research: "from-violet-600/30 to-violet-900/30",
  business: "from-amber-600/30 to-amber-900/30",
} as const;

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface NewsCardProps {
  item: NewsItem;
  onToggleBookmark: (id: number, bookmarked: boolean) => void;
  onMarkRead: (id: number) => void;
}

export function NewsCard({ item, onToggleBookmark, onMarkRead }: NewsCardProps) {
  const isRead = item.read === 1;
  const isBookmarked = item.bookmarked === 1;

  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700",
        !isRead && "border-l-2 border-l-blue-500",
        isRead && "opacity-75"
      )}
      onClick={() => {
        if (!isRead) onMarkRead(item.id);
      }}
    >
      {/* Thumbnail */}
      <div className="hidden sm:block flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-24 w-32 rounded-md object-cover bg-zinc-800"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {!item.image_url && (
          <div
            className={cn(
              "flex h-24 w-32 items-center justify-center rounded-md bg-gradient-to-br",
              TOPIC_GRADIENTS[item.topic]
            )}
          >
            <span className="text-2xl">
              {item.topic === "tools" ? "🛠" : item.topic === "research" ? "🔬" : "💼"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Badges row */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
            {item.source}
          </span>
          <Badge className={cn("border-0 text-[11px]", TOPIC_COLORS[item.topic])}>
            {TOPIC_LABELS[item.topic]}
          </Badge>
        </div>

        {/* Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 hover:text-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (!isRead) onMarkRead(item.id);
          }}
        >
          {item.title}
        </a>

        {/* Summary */}
        {item.summary && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {item.summary}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {!isRead && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Unread" />
            )}
            {item.published_at && (
              <span className="text-[11px] text-zinc-600">
                {relativeTime(item.published_at)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(item.id, !isBookmarked);
            }}
            className={cn(
              "p-1 rounded transition-colors",
              isBookmarked
                ? "text-amber-400 hover:text-amber-300"
                : "text-zinc-600 hover:text-zinc-400"
            )}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Star className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}
