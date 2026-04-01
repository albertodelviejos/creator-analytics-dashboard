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
import type { ContentItem } from "@/components/ContentCard";

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: ContentItem) => void;
  editItem?: ContentItem | null;
}

type PostType = "Reel" | "Post" | "Carrusel" | "Story";
type Status = "backlog" | "draft" | "scheduled";
type Priority = "0" | "1" | "2";

export function AddContentModal({
  open,
  onOpenChange,
  onSave,
  editItem,
}: AddContentModalProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<PostType>("Post");
  const [status, setStatus] = useState<Status>("backlog");
  const [scheduledAt, setScheduledAt] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setCaption(editItem.caption || "");
      setPostType(editItem.post_type);
      setStatus(editItem.status === "published" ? "backlog" : editItem.status as Status);
      setScheduledAt(editItem.scheduled_at || "");
      setHashtags(editItem.hashtags || "");
      setNotes(editItem.notes || "");
      setPriority(String(editItem.priority) as Priority);
    } else {
      setTitle("");
      setCaption("");
      setPostType("Post");
      setStatus("backlog");
      setScheduledAt("");
      setHashtags("");
      setNotes("");
      setPriority("0");
    }
  }, [editItem, open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      caption: caption || null,
      post_type: postType,
      status,
      scheduled_at: status === "scheduled" && scheduledAt ? scheduledAt : null,
      hashtags: hashtags || null,
      notes: notes || null,
      priority: parseInt(priority, 10),
    };

    try {
      const url = editItem
        ? `/api/instagram/content/${editItem.id}`
        : "/api/instagram/content";
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
          <DialogTitle>{editItem ? "Edit Content" : "New Content"}</DialogTitle>
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
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={3}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Post">Post</SelectItem>
                  <SelectItem value="Reel">Reel</SelectItem>
                  <SelectItem value="Carrusel">Carrusel</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
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
              placeholder="#content #instagram"
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
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Saving..." : editItem ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
