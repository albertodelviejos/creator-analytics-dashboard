"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  platform: "instagram" | "youtube";
  type: string;
  status: "published" | "scheduled" | "draft";
  url: string | null;
  views: number | null;
  likes: number | null;
}

const TYPE_ICONS: Record<string, string> = {
  Reel: "🎬",
  Carrusel: "📸",
  Post: "🖼️",
  Story: "📱",
  Video: "🎥",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function chipClasses(platform: "instagram" | "youtube", status: string) {
  if (platform === "instagram") {
    if (status === "scheduled") {
      return "border border-dashed border-violet-500/40 text-violet-400 bg-transparent";
    }
    if (status === "draft") {
      return "border border-dotted border-violet-500/30 text-violet-500 bg-transparent opacity-60";
    }
    return "bg-violet-500/20 text-violet-300 border border-violet-500/30";
  }
  // youtube
  if (status === "scheduled") {
    return "border border-dashed border-red-500/40 text-red-400 bg-transparent";
  }
  if (status === "draft") {
    return "border border-dotted border-red-500/30 text-red-500 bg-transparent opacity-60";
  }
  return "bg-red-500/20 text-red-300 border border-red-500/30";
}

export function CalendarChip({ item }: { item: CalendarItem }) {
  const icon = TYPE_ICONS[item.type] || "📄";
  const truncated =
    item.title.length > 20 ? item.title.slice(0, 20) + "…" : item.title;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "w-full rounded px-1.5 py-0.5 text-left text-[11px] leading-tight truncate cursor-pointer transition-opacity hover:opacity-80",
          chipClasses(item.platform, item.status)
        )}
      >
        <span className="mr-0.5">{icon}</span>
        {truncated}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" side="right" align="start" sideOffset={8}>
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  item.platform === "instagram"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-red-500/20 text-red-300"
                )}
              >
                {item.platform === "instagram" ? "Instagram" : "YouTube"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {icon} {item.type}
              </span>
              <span
                className={cn(
                  "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  item.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : item.status === "scheduled"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-zinc-500/20 text-zinc-400"
                )}
              >
                {item.status}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug">{item.title}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            {formatDateTime(item.date)}
          </div>

          {item.status === "published" &&
            (item.views !== null || item.likes !== null) && (
              <div className="flex gap-4 text-xs">
                {item.views !== null && (
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatNumber(item.views)}
                    </span>{" "}
                    views
                  </span>
                )}
                {item.likes !== null && (
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatNumber(item.likes)}
                    </span>{" "}
                    likes
                  </span>
                )}
              </div>
            )}

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View original →
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
