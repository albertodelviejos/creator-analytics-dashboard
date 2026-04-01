"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/instagram", label: "Instagram", icon: "📸" },
  { href: "/youtube", label: "YouTube", icon: "🎬" },
  { href: "/x", label: "X", icon: "𝕏" },
  { href: "/threads", label: "Threads", icon: "🧵" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/competitors", label: "Competitors", icon: "👥" },
  { href: "/news", label: "News", icon: "📰" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-tight">Creator Hub</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "»" : "«"}
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-4">
          <p className="text-xs text-muted-foreground">
            Content Management Dashboard
          </p>
        </div>
      )}
    </aside>
  );
}
