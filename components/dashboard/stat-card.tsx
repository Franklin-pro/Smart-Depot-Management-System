import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "primary",
  hint,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: string; up: boolean }
  tone?: "primary" | "success" | "danger" | "info" | "neutral"
  hint?: string
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-chart-2/10 text-chart-2",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-chart-3/10 text-chart-3",
    neutral: "bg-muted text-muted-foreground",
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trend.up ? "text-chart-2" : "text-destructive",
            )}
          >
            {trend.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {trend.value}
          </span>
        )}
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  )
}
