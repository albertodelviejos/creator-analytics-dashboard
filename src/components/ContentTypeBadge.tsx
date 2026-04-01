import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ContentType = "Reel" | "Post" | "Carrusel";

const typeConfig: Record<ContentType, { color: string }> = {
  Reel: { color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  Post: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  Carrusel: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

interface ContentTypeBadgeProps {
  type: ContentType;
  className?: string;
}

export function ContentTypeBadge({ type, className }: ContentTypeBadgeProps) {
  const config = typeConfig[type];
  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      {type}
    </Badge>
  );
}
