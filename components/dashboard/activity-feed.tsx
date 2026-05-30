"use client"

import { ShoppingCart, Package, Wallet, PackageOpen, CalendarClock, UserPlus } from "lucide-react"
import { useApp } from "@/lib/store"
import { timeAgo } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Activity } from "@/lib/types"

const config: Record<Activity["type"], { icon: typeof ShoppingCart; cls: string }> = {
  sale: { icon: ShoppingCart, cls: "bg-chart-2/10 text-chart-2" },
  stock: { icon: Package, cls: "bg-chart-3/10 text-chart-3" },
  expense: { icon: Wallet, cls: "bg-chart-4/10 text-chart-4" },
  empty: { icon: PackageOpen, cls: "bg-primary/10 text-primary" },
  expiry: { icon: CalendarClock, cls: "bg-destructive/10 text-destructive" },
  user: { icon: UserPlus, cls: "bg-chart-5/10 text-chart-5" },
}

export function ActivityFeed() {
  const { activities } = useApp()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.slice(0, 7).map((a) => {
          const c = config[a.type]
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-lg px-1 py-2">
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", c.cls)}>
                <c.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{a.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
