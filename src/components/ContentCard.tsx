"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ContentItem {
  id: number;
  title: string;
  caption: string | null;
  post_type: "Reel" | "Post" | "Carrusel" | "Story";
  status: "backlog" | "draft" | "scheduled" | "published";
  scheduled_at: string | null;
  published_at: string | null;
  media_url: string | null;
  hashtags: string | null;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

const typeColors: Record<ContentItem["post_type"], string> = {
  Reel: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Post: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Carrusel: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Story: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const priorityColors: Record<number, string> = {
  2: "bg-red-500",
  1: "bg-amber-500",
  0: "bg-green-500",
};

const priorityLabels: Record<number, string> = {
  2: "High",
  1: "Medium",
  0: "Low",
};

interface ContentCardProps {
  item: ContentItem;
  onEdit: (item: ContentItem) => void;
  onAdvance: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  isDragging?: boolean;
}

export function ContentCard({
  item,
  onEdit,
  onAdvance,
  onDelete,
  isDragging,
}: ContentCardProps) {
  const nextStatus: Record<string, string | null> = {
    backlog: "draft",
    draft: "scheduled",
    scheduled: "published",
    published: null,
  };

  const canAdvance = nextStatus[item.status] !== null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(item.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-zinc-700",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="outline" className={cn("text-[10px]", typeColors[item.post_type])}>
          {item.post_type}
        </Badge>
        <div className="flex items-center gap-1.5">
          {item.notes && (
            <span className="w-2 h-2 rounded-full bg-blue-400" title="Has notes" />
          )}
          <span
            className={cn("w-2 h-2 rounded-full", priorityColors[item.priority] || "bg-green-500")}
            title={`Priority: ${priorityLabels[item.priority] || "Low"}`}
          />
        </div>
      </div>

      <h4 className="font-medium text-sm text-zinc-100 mb-1 line-clamp-1">
        {item.title}
      </h4>

      {item.caption && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{item.caption}</p>
      )}

      {item.scheduled_at && item.status === "scheduled" && (
        <p className="text-[10px] text-amber-400/80 mb-2">
          📅 {new Date(item.scheduled_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}

      {item.hashtags && (
        <p className="text-[10px] text-zinc-600 line-clamp-1 mb-2">
          {item.hashtags}
        </p>
      )}

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t border-zinc-800">
        <button
          onClick={() => onEdit(item)}
          className="text-[10px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
        >
          Edit
        </button>
        {canAdvance && (
          <button
            onClick={() => onAdvance(item)}
            className="text-[10px] text-zinc-400 hover:text-emerald-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
          >
            → {nextStatus[item.status]}
          </button>
        )}
        <button
          onClick={() => onDelete(item)}
          className="text-[10px] text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
