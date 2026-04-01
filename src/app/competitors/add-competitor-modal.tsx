"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddCompetitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editData?: {
    id: number;
    name: string;
    instagram_handle: string | null;
    youtube_handle: string | null;
    notes: string | null;
  } | null;
}

export function AddCompetitorModal({
  open,
  onOpenChange,
  onSaved,
  editData,
}: AddCompetitorModalProps) {
  const [name, setName] = useState(editData?.name ?? "");
  const [igHandle, setIgHandle] = useState(editData?.instagram_handle ?? "");
  const [ytHandle, setYtHandle] = useState(editData?.youtube_handle ?? "");
  const [notes, setNotes] = useState(editData?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/competitors/${editData.id}`
        : "/api/competitors";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          instagram_handle: igHandle.trim() || null,
          youtube_handle: ytHandle.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        setName("");
        setIgHandle("");
        setYtHandle("");
        setNotes("");
        onOpenChange(false);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Competitor" : "Add Competitor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Creator name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ig-handle">Instagram Handle</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="ig-handle"
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value.replace("@", ""))}
                placeholder="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yt-handle">YouTube Handle</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="yt-handle"
                value={ytHandle}
                onChange={(e) => setYtHandle(e.target.value.replace("@", ""))}
                placeholder="channelhandle"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this competitor..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : isEdit ? "Update" : "Add Competitor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
