"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useApp } from "@/lib/store"
import { navByRole, roleLabels } from "@/lib/navigation"
import { BrandLogo } from "@/components/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppSidebar() {
  const { currentUser, logout } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()

  if (!currentUser) return null
  const items = navByRole[currentUser.role]
  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <BrandLogo textClassName="text-sidebar-foreground" iconClassName="size-8" className="group-data-[collapsible=icon]:justify-center" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-sidebar-foreground">{currentUser.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{roleLabels[currentUser.role]}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => {
                logout()
                router.replace("/login")
              }}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
