import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StockStatus } from "@/lib/types"
import { statusLabels } from "@/lib/format"

const styles: Record<StockStatus, string> = {
  available: "border-transparent bg-chart-2/15 text-chart-2",
  low: "border-transparent bg-primary/15 text-primary",
  expiring: "border-transparent bg-chart-4/15 text-chart-4",
  expired: "border-transparent bg-destructive/15 text-destructive",
  damaged: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(styles[status], className)}>
      {statusLabels[status]}
    </Badge>
  )
}
