"use client"

import { formatDistanceToNow } from "date-fns"
import { Activity } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  Truck,
  RefreshCw,
  Wrench,
  UserPlus,
  Clock,
} from "lucide-react"

const activityIcons = {
  sale: ShoppingCart,
  stock: Package,
  expense: DollarSign,
  empty: RefreshCw,
  supplier: Truck,
  user: Users,
  expiry: AlertTriangle,
  customer: UserPlus,
  return: RefreshCw,
  adjustment: Wrench,
  damage: AlertTriangle,
}

const activityColors = {
  sale: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  stock: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  expense: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  empty: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  supplier: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  user: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  expiry: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  customer: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  return: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  adjustment: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  damage: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  // Helper function to safely format dates
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "Just now"
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Just now"
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Just now"
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Clock className="size-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {activities.slice(0, 10).map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Clock
            const colorClass = activityColors[activity.type as keyof typeof activityColors] || "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className={`rounded-full p-2 ${colorClass}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-tight">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}