"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Bell, Moon, Sun, AlertTriangle, Info, Search } from "lucide-react"
import { useApp } from "@/lib/store"
import { timeAgo } from "@/lib/format"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const levelStyles = {
  info: { icon: Info, cls: "text-chart-3 bg-chart-3/10" },
  warning: { icon: AlertTriangle, cls: "text-primary bg-primary/10" },
  urgent: { icon: AlertTriangle, cls: "text-destructive bg-destructive/10" },
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <Button variant="ghost" size="icon" className="size-9" aria-label="Toggle theme" />
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

export function DashboardHeader({ title, description }: { title: string; description?: string }) {
  const { notifications, markNotificationsRead } = useApp()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold leading-tight md:text-lg">{title}</h1>
        {description && <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>}
      </div>

      <div className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="h-9 w-56 pl-9" />
      </div>

      <ThemeToggle />

      <Popover onOpenChange={(open) => open && markNotificationsRead()}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative size-9" aria-label="Notifications">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <Badge variant="secondary" className="text-xs">
              {notifications.length}
            </Badge>
          </div>
          <ScrollArea className="h-80">
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const s = levelStyles[n.level]
                return (
                  <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", s.cls)}>
                      <s.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </header>
  )
}
