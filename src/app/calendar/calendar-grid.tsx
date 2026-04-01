"use client";

import { cn } from "@/lib/utils";
import { CalendarChip, type CalendarItem } from "./calendar-chip";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_CHIPS = 3;

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  items: CalendarItem[];
}

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay() returns 0=Sun, adjust to 0=Mon
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  // Days from previous month to fill
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  return { daysInMonth, startDay, prevMonthLastDay };
}

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function CalendarGrid({ year, month, items }: CalendarGridProps) {
  const today = new Date();
  const { daysInMonth, startDay, prevMonthLastDay } = getMonthData(
    year,
    month
  );

  // Group items by day of month
  const itemsByDay: Record<number, CalendarItem[]> = {};
  for (const item of items) {
    const d = parseDate(item.date);
    const day = d.getDate();
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m === month && y === year) {
      if (!itemsByDay[day]) itemsByDay[day] = [];
      itemsByDay[day].push(item);
    }
  }

  // Build cells: { day, isCurrentMonth, isToday, isWeekend }
  type Cell = {
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    items: CalendarItem[];
  };

  const cells: Cell[] = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: false,
      items: [],
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const colIndex = (cells.length) % 7;
    const isWeekend = colIndex >= 5; // Sat=5, Sun=6
    cells.push({
      day: d,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
      isWeekend,
      items: itemsByDay[d] || [],
    });
  }

  // Next month leading days
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: nextDay++,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: false,
      items: [],
    });
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-px rounded-lg border border-zinc-800 bg-zinc-800 overflow-hidden">
          {/* Day headers */}
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-2 text-center text-xs font-medium text-muted-foreground",
                i >= 5 ? "bg-zinc-900/80" : "bg-zinc-950"
              )}
            >
              {d}
            </div>
          ))}

          {/* Day cells */}
          {cells.map((cell, i) => {
            const colIndex = i % 7;
            const isWeekendCol = colIndex >= 5;
            const overflow = cell.items.length - MAX_VISIBLE_CHIPS;

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] p-1.5 transition-colors group relative",
                  cell.isCurrentMonth
                    ? isWeekendCol
                      ? "bg-zinc-900/60"
                      : "bg-zinc-950"
                    : "bg-zinc-950/40",
                  cell.isToday && "ring-2 ring-inset ring-blue-500"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      !cell.isCurrentMonth && "text-zinc-600",
                      cell.isToday &&
                        "bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                    )}
                  >
                    {cell.day}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {cell.items.slice(0, MAX_VISIBLE_CHIPS).map((item) => (
                    <CalendarChip key={item.id} item={item} />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{overflow} more
                    </div>
                  )}
                </div>

                {/* Hover "+" for empty current-month days */}
                {cell.isCurrentMonth && cell.items.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-zinc-700 text-lg">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .filter((d) => itemsByDay[d]?.length)
          .map((d) => (
            <div key={d} className="rounded-lg border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    d === today.getDate() &&
                      month === today.getMonth() &&
                      year === today.getFullYear() &&
                      "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  )}
                >
                  {d}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(year, month, d).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="space-y-1">
                {itemsByDay[d].map((item) => (
                  <CalendarChip key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        {Object.keys(itemsByDay).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No content this month
          </div>
        )}
      </div>
    </div>
  );
}
