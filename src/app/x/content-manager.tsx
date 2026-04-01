"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XAddContentModal } from "./add-content-modal";

export interface XContentItem {
  id: number;
  title: string;
  text: string | null;
  post_type: "tweet" | "thread" | "reply" | "quote";
  status: "backlog" | "draft" | "scheduled" | "published";
  scheduled_at: string | null;
  published_at: string | null;
  hashtags: string | null;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

type Status = "backlog" | "draft" | "scheduled" | "published";

const columns: { status: Status; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "border-zinc-600" },
  { status: "draft", label: "Draft", color: "border-blue-500" },
  { status: "scheduled", label: "Scheduled", color: "border-amber-500" },
  { status: "published", label: "Published", color: "border-emerald-500" },
];

const headerBg: Record<Status, string> = {
  backlog: "bg-zinc-500/10 text-zinc-400",
  draft: "bg-blue-500/10 text-blue-400",
  scheduled: "bg-amber-500/10 text-amber-400",
  published: "bg-emerald-500/10 text-emerald-400",
};

const nextStatus: Record<Status, Status | null> = {
  backlog: "draft",
  draft: "scheduled",
  scheduled: "published",
  published: null,
};

const typeColors: Record<XContentItem["post_type"], string> = {
  tweet: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  thread: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  reply: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  quote: "bg-teal-500/10 text-teal-400 border-teal-500/20",
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

export function XContentManager() {
  const [items, setItems] = useState<XContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<XContentItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/x/content");
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleEdit(item: XContentItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  async function handleAdvance(item: XContentItem) {
    const next = nextStatus[item.status];
    if (!next) return;

    const res = await fetch(`/api/x/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  async function handleDelete(item: XContentItem) {
    const res = await fetch(`/api/x/content/${item.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  function handleSave(saved: XContentItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id);
      if (exists) {
        return prev.map((i) => (i.id === saved.id ? saved : i));
      }
      return [saved, ...prev];
    });
    setEditItem(null);
  }

  function handleOpenNew() {
    setEditItem(null);
    setModalOpen(true);
  }

  async function handleDrop(e: DragEvent, targetStatus: Status) {
    e.preventDefault();
    setDragOverColumn(null);
    const itemId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(itemId)) return;

    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === targetStatus) return;

    const res = await fetch(`/api/x/content/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  function handleDragOver(e: DragEvent, status: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading content...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-zinc-500">
            {items.length} item{items.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={handleOpenNew} size="sm" className="bg-sky-600 hover:bg-sky-700">
          + Add Content
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colItems = items.filter((i) => i.status === col.status);
          return (
            <div
              key={col.status}
              className={cn(
                "rounded-lg border border-zinc-800 bg-zinc-950 min-h-[400px] flex flex-col",
                dragOverColumn === col.status && "border-zinc-600 bg-zinc-900/50"
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-t-lg border-b-2",
                  col.color
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                    headerBg[col.status]
                  )}
                >
                  {col.label}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {colItems.length}
                </span>
              </div>

              <div className="p-2 flex flex-col gap-2 flex-1">
                {colItems.map((item) => {
                  const canAdvance = nextStatus[item.status] !== null;
                  const charCount = item.text?.length ?? 0;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(item.id));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="group bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className={cn("text-[10px]", typeColors[item.post_type])}>
                          {item.post_type}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {charCount > 0 && (
                            <span className={cn(
                              "text-[10px] font-mono",
                              charCount > 280 ? "text-red-400" : "text-zinc-500"
                            )}>
                              {charCount}/280
                            </span>
                          )}
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

                      {item.text && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{item.text}</p>
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

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t border-zinc-800">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                        >
                          Edit
                        </button>
                        {canAdvance && (
                          <button
                            onClick={() => handleAdvance(item)}
                            className="text-[10px] text-zinc-400 hover:text-emerald-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            → {nextStatus[item.status]}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-[10px] text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="flex items-center justify-center flex-1 text-zinc-700 text-xs py-8">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <XAddContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        editItem={editItem}
      />
    </div>
  );
}
