import { Badge } from "@/components/ui/badge";
import { getStatusConfig, type StatusEntity } from "@/lib/status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  entity: StatusEntity;
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  entity,
  status,
  size = "md",
  className,
}: StatusBadgeProps) {
  const { label, color, icon } = getStatusConfig(entity, status);

  return (
    <Badge color={color} size={size} icon={icon} className={cn(className)}>
      {label}
    </Badge>
  );
}