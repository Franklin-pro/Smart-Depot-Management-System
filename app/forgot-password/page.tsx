"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      toast.success("Reset link sent to your email")
    }, 700)
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="space-y-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MailCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Check your inbox</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>. Follow
              the instructions in the email to reset your password.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Didn&apos;t receive it? Try again
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
            <p className="text-sm text-muted-foreground">
              Enter the email linked to your account and we&apos;ll send you a reset link.
            </p>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </>
      )}
    </AuthShell>
  )
}
