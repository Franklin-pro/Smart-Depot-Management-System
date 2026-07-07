"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Eye, EyeOff, Loader2, ArrowLeft, 
  CheckCircle, AlertCircle, Lock, 
  KeyRound, Sparkles, Mail
} from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { usersService } from "@/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get token from URL (from email link)
  const urlToken = searchParams.get("token")
  
  const [token, setToken] = useState(urlToken || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // If token is in URL, auto-fill it
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken)
    }
  }, [urlToken])

  // Handle reset password with token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("Reset token is missing. Please request a new reset link.")
      return
    }

    if (!newPassword) {
      toast.error("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      // Call API to reset password with token and new password
      await usersService.resetPassword({
        token: token,
        newPassword: newPassword
      })
      
      setResetSuccess(true)
      toast.success("Password reset successful!")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      
    } catch (error: any) {
      console.error('Reset password error:', error)
      const errorMessage = error.response?.data?.detail || error.message || "Failed to reset password"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle resend token
  const handleResendToken = async () => {
    const email = prompt("Please enter your email address to receive a new reset link:")
    if (!email) return
    
    try {
      await usersService.forgotPassword(email)
      toast.success("New reset link sent to your email!")
    } catch (error: any) {
      console.error('Resend error:', error)
      toast.error("Failed to resend reset link. Please try again.")
    }
  }

  // Password strength
  const passwordStrength = newPassword.length === 0 ? 0 : 
    newPassword.length < 6 ? 1 :
    newPassword.length < 8 ? 2 :
    newPassword.length < 10 ? 3 : 4

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "bg-gray-200 dark:bg-gray-700"
      case 1: return "bg-red-400"
      case 2: return "bg-yellow-400"
      case 3: return "bg-blue-400"
      case 4: return "bg-green-400"
      default: return "bg-gray-200"
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0: return "Enter a password"
      case 1: return "Too short"
      case 2: return "Weak"
      case 3: return "Good"
      case 4: return "Strong"
      default: return ""
    }
  }

  const getStrengthColorText = () => {
    switch (passwordStrength) {
      case 0: return "text-muted-foreground"
      case 1: return "text-red-500"
      case 2: return "text-yellow-500"
      case 3: return "text-blue-500"
      case 4: return "text-green-500"
      default: return "text-muted-foreground"
    }
  }

  // Success Dialog
  const SuccessDialog = () => (
    <Dialog open={resetSuccess} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl">Password Reset Successful!</DialogTitle>
          <DialogDescription>
            Your password has been reset successfully. You can now sign in with your new password.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={() => router.push("/login")}>
            Go to Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <AuthShell>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Set New Password
          </h2>
          <p className="text-sm text-muted-foreground">
            {urlToken 
              ? "Create a new password for your account" 
              : "Enter the reset token from your email to create a new password"
            }
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 flex flex-col gap-4">
          {urlToken ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/50">
                  <Sparkles className="size-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Reset Link Verified
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Enter your new password below.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Enter Reset Token
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Enter the reset token from your email or click the link in the email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Token Field - Hidden if token is in URL */}
          {!urlToken && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">Reset Token</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the reset token from your email"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the token you received in your email
              </p>
            </div>
          )}

          {/* New Password Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getStrengthColorText()}`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Min 6 characters</span>
                  <span>Strong password</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" />
                Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="size-3" />
                Passwords match
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            {!urlToken && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/login")}
                disabled={loading}
                className="flex-1"
              >
                <ArrowLeft className="size-4 mr-2" />
                Back
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || !token || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound className="size-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </div>

          {!urlToken && (
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendToken}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Didn't receive a token? Request new one
              </button>
              <div>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                  <ArrowLeft className="size-3" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {urlToken && (
            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="size-3" />
                Back to Sign In
              </Link>
            </div>
          )}
        </form>
      </AuthShell>

      <SuccessDialog />
    </>
  )
}