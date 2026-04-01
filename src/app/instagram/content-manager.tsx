"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import { ContentCard, type ContentItem } from "@/components/ContentCard";
import { AddContentModal } from "./add-content-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function ContentManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/instagram/content");
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleEdit(item: ContentItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  async function handleAdvance(item: ContentItem) {
    const next = nextStatus[item.status];
    if (!next) return;

    const res = await fetch(`/api/instagram/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  async function handleDelete(item: ContentItem) {
    const res = await fetch(`/api/instagram/content/${item.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  function handleSave(saved: ContentItem) {
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

    const res = await fetch(`/api/instagram/content/${itemId}`, {
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
        <Button onClick={handleOpenNew} size="sm">
          + Add Content
        </Button>
      </div>

      {/* Kanban Board */}
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
              {/* Column header */}
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

              {/* Cards */}
              <div className="p-2 flex flex-col gap-2 flex-1">
                {colItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onAdvance={handleAdvance}
                    onDelete={handleDelete}
                  />
                ))}
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

      <AddContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        editItem={editItem}
      />
    </div>
  );
}
