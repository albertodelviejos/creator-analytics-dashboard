"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay() returns 0=Sun, adjust to 0=Mon
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  return { daysInMonth, startDay };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { daysInMonth, startDay } = getMonthData(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

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

  const isToday = (day: number | null) =>
    day !== null &&
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Content Calendar</h2>
        <p className="text-muted-foreground">
          Plan and schedule your content across platforms
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              &larr;
            </Button>
            <CardTitle className="text-lg">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              &rarr;
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {cells.map((day, i) => (
              <div
                key={i}
                className={`min-h-[80px] rounded-md border border-border p-2 ${
                  day === null
                    ? "bg-transparent"
                    : "bg-card hover:bg-accent/30 transition-colors"
                } ${isToday(day) ? "ring-2 ring-primary" : ""}`}
              >
                {day !== null && (
                  <span className="text-xs font-medium">{day}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Connect your platforms to see scheduled content
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Scheduled posts from Instagram, YouTube, and other platforms will
          appear here automatically.
        </p>
      </div>
    </div>
  );
}
