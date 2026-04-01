import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "youtube" | "linkedin";

const platformConfig: Record<Platform, { label: string; color: string; icon: string }> = {
  instagram: {
    label: "Instagram",
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    icon: "📸",
  },
  youtube: {
    label: "YouTube",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: "▶️",
  },
  linkedin: {
    label: "LinkedIn",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: "💼",
  },
};

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
