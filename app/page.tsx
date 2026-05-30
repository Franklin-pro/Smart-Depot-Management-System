"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/store"
import { roleLandingPage } from "@/lib/navigation"
import { BrandLogo } from "@/components/brand-logo"

export default function Home() {
  const { currentUser, ready } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    if (currentUser) router.replace(roleLandingPage[currentUser.role])
    else router.replace("/login")
  }, [ready, currentUser, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <BrandLogo iconClassName="size-12" showText={false} />
        <p className="text-sm text-muted-foreground">Loading your depot...</p>
      </div>
    </main>
  )
}
