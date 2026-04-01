"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  platform: string;
  onComplete?: () => void;
}

export function SyncButton({ platform, onComplete }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/${platform}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("Synced successfully");
        onComplete?.();
      } else {
        setStatus(data.error || "Sync failed");
      }
    } catch {
      setStatus("Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleSync} disabled={loading} variant="outline" size="sm">
        {loading ? "Syncing..." : "Sync Data"}
      </Button>
      {status && (
        <span className="text-xs text-muted-foreground">{status}</span>
      )}
    </div>
  );
}
