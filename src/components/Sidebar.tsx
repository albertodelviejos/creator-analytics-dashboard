"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/instagram", label: "Instagram", icon: "📸" },
  { href: "/youtube", label: "YouTube", icon: "▶️" },
  { href: "/linkedin", label: "LinkedIn", icon: "💼" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center px-6">
        <h1 className="text-lg font-bold tracking-tight">Creator Analytics</h1>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          Multi-platform analytics
        </p>
      </div>
    </aside>
  );
}
