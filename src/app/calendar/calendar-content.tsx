"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarGrid } from "./calendar-grid";
import type { CalendarItem } from "./calendar-chip";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type PlatformFilter = "all" | "instagram" | "youtube" | "x" | "threads";

export function CalendarContent() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(
        `/api/calendar?month=${monthStr}&platform=${platform}`
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [year, month, platform]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const platformFilters: { value: PlatformFilter; label: string; color: string }[] = [
    { value: "all", label: "All", color: "" },
    { value: "instagram", label: "Instagram", color: "bg-violet-500" },
    { value: "youtube", label: "YouTube", color: "bg-red-500" },
    { value: "x", label: "X", color: "bg-sky-500" },
    { value: "threads", label: "Threads", color: "bg-fuchsia-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Content Calendar
          </h2>
          <p className="text-muted-foreground text-sm">
            View published and scheduled content across platforms
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            ←
          </Button>
          <button
            onClick={goToToday}
            className="min-w-[160px] text-center text-sm font-semibold hover:text-blue-400 transition-colors"
          >
            {MONTH_NAMES[month]} {year}
          </button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            →
          </Button>
        </div>

        {/* Platform filters + legend */}
        <div className="flex items-center gap-2">
          {platformFilters.map((f) => (
            <Button
              key={f.value}
              variant={platform === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(f.value)}
              className={cn(
                "text-xs",
                platform === f.value &&
                  f.value === "instagram" &&
                  "bg-violet-600 hover:bg-violet-700 text-white border-violet-600",
                platform === f.value &&
                  f.value === "youtube" &&
                  "bg-red-600 hover:bg-red-700 text-white border-red-600",
                platform === f.value &&
                  f.value === "x" &&
                  "bg-sky-600 hover:bg-sky-700 text-white border-sky-600",
                platform === f.value &&
                  f.value === "threads" &&
                  "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border-fuchsia-600"
              )}
            >
              {f.color && (
                <span
                  className={cn("w-2 h-2 rounded-full mr-1.5", f.color)}
                />
              )}
              {f.label}
            </Button>
          ))}

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 ml-3 pl-3 border-l border-zinc-800">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-4 h-1.5 rounded-sm bg-violet-500/40" />
              Published
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-4 h-1.5 rounded-sm border border-dashed border-violet-500/40" />
              Scheduled
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className={cn("transition-opacity", loading && "opacity-50")}>
        <CalendarGrid year={year} month={month} items={items} />
      </div>
    </div>
  );
}
