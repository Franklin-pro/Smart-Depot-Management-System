"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { useApp } from "@/lib/store"
import { roleLandingPage, roleLabels } from "@/lib/navigation"
import type { Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const demoAccounts: { role: Role; email: string }[] = [
  { role: "owner", email: "owner@beerdepot.com" },
  { role: "manager", email: "manager@beerdepot.com" },
  { role: "cashier", email: "cashier@beerdepot.com" },
  { role: "storekeeper", email: "store@beerdepot.com" },
]

export default function LoginPage() {
  const { login } = useApp()
  const router = useRouter()
  const [email, setEmail] = useState("owner@beerdepot.com")
  const [password, setPassword] = useState("password")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const user = login(email, password)
      if (user) {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}`)
        router.replace(roleLandingPage[user.role])
      } else {
        toast.error("Invalid credentials. Try a demo account below.")
        setLoading(false)
      }
    }, 600)
  }

  return (
    <AuthShell>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your depot management account.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@beerdepot.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Keep me signed in
          </Label>
        </div>

        <Button type="submit" className="mt-2" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs font-medium text-muted-foreground">Quick demo login (any password)</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {demoAccounts.map((a) => (
            <Button
              key={a.role}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs"
              onClick={() => {
                setEmail(a.email)
                setPassword("password")
              }}
            >
              {roleLabels[a.role]}
            </Button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
