"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { XContentItem } from "./content-manager";

interface XAddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: XContentItem) => void;
  editItem?: XContentItem | null;
}

type PostType = "tweet" | "thread" | "reply" | "quote";
type Status = "backlog" | "draft" | "scheduled";
type Priority = "0" | "1" | "2";

const MAX_CHARS = 280;

export function XAddContentModal({
  open,
  onOpenChange,
  onSave,
  editItem,
}: XAddContentModalProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [postType, setPostType] = useState<PostType>("tweet");
  const [status, setStatus] = useState<Status>("backlog");
  const [scheduledAt, setScheduledAt] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setText(editItem.text || "");
      setPostType(editItem.post_type);
      setStatus(editItem.status === "published" ? "backlog" : editItem.status as Status);
      setScheduledAt(editItem.scheduled_at || "");
      setHashtags(editItem.hashtags || "");
      setNotes(editItem.notes || "");
      setPriority(String(editItem.priority) as Priority);
    } else {
      setTitle("");
      setText("");
      setPostType("tweet");
      setStatus("backlog");
      setScheduledAt("");
      setHashtags("");
      setNotes("");
      setPriority("0");
    }
  }, [editItem, open]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      text: text || null,
      post_type: postType,
      status,
      scheduled_at: status === "scheduled" && scheduledAt ? scheduledAt : null,
      hashtags: hashtags || null,
      notes: notes || null,
      priority: parseInt(priority, 10),
    };

    try {
      const url = editItem
        ? `/api/x/content/${editItem.id}`
        : "/api/x/content";
      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        onSave(saved);
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Tweet" : "New Tweet"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="text">Tweet Text</Label>
              <span
                className={cn(
                  "text-xs font-mono",
                  isOverLimit ? "text-red-400" : charCount > MAX_CHARS * 0.9 ? "text-amber-400" : "text-zinc-500"
                )}
              >
                {charCount}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              className={cn(
                "bg-zinc-900 border-zinc-800",
                isOverLimit && "border-red-500/50 focus-visible:ring-red-500"
              )}
            />
            {isOverLimit && (
              <p className="text-xs text-red-400">
                Tweet exceeds {MAX_CHARS} character limit by {charCount - MAX_CHARS} characters
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tweet">Tweet</SelectItem>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="reply">Reply</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "scheduled" && (
            <div className="grid gap-2">
              <Label htmlFor="scheduled_at">Scheduled Date</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Low</SelectItem>
                <SelectItem value="1">Medium</SelectItem>
                <SelectItem value="2">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#content #twitter"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {saving ? "Saving..." : editItem ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
