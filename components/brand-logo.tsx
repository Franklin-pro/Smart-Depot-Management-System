import { Beer } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandLogo({
  className,
  iconClassName,
  showText = true,
  textClassName,
}: {
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName,
        )}
      >
        <Beer className="size-5" />
      </div>
      {showText && (
        <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>
          Beer<span className="text-primary">Depot</span>
        </span>
      )}
    </div>
  )
}
