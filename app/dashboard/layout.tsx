"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { BrandLogo } from "@/components/brand-logo"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, ready } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (ready && !currentUser) router.replace("/login")
  }, [ready, currentUser, router])

  if (!ready || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <BrandLogo iconClassName="size-12 animate-pulse" showText={false} />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
