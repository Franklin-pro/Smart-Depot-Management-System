"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, KeyRound, Check, X } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { useApp } from "@/lib/store"
import { roleLandingPage } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { usersService } from "@/services"
import type { Role } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const { login } = useApp()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Change password state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [loginResponse, setLoginResponse] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Please enter both email and password")
      return
    }

    setLoading(true)
    
    try {
      // Use the usersService login
      const response = await usersService.login(email, password)
      
      console.log("Login response:", response)

      // Get user data from response
      const user = response.user

      // Update app state
      login(email, password)

      // Check if user must change password
      if (user.mustChangePassword === true) {
        // Store the response for password change
        setLoginResponse(response)
        // Pre-fill the current password field
        setCurrentPassword(password)
        setChangePasswordOpen(true)
        setLoading(false)
        toast.info("Please change your password before continuing")
        return
      }

      // Show welcome message
      toast.success(`Welcome back, ${user.name}!`)
      
      // Get the role and redirect
      const userRole = user.role as Role
      const redirectPath = roleLandingPage[userRole] || '/dashboard'
      
      console.log(`Redirecting to: ${redirectPath} for role: ${userRole}`)
      
      // Redirect to the user's role-based landing page
      router.push(redirectPath)
      
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Extract error message from response
      const errorMessage = error.response?.data?.detail || error.message || "Invalid email or password"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword() {
    // Validate passwords
    if (!currentPassword) {
      toast.error("Please enter your current password")
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

    setChangingPassword(true)

    try {
      // Call the change password API with the correct request body
      await usersService.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword
      })

      toast.success("Password changed successfully!")
      
      // Close the dialog
      setChangePasswordOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      // Get user from login response
      const user = loginResponse?.user
      
      // Show welcome message
      toast.success(`Welcome back, ${user?.name}!`)
      
      // Get the role and redirect
      const userRole = user?.role as Role
      const redirectPath = roleLandingPage[userRole] || '/dashboard'
      
      // Redirect to the user's role-based landing page
      router.push(redirectPath)
      
    } catch (error: any) {
      console.error('Password change error:', error)
      const errorMessage = error.response?.data?.detail || error.message || "Failed to change password"
      toast.error(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
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
              disabled={loading || changePasswordOpen}
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
                disabled={loading || changePasswordOpen}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
                disabled={loading || changePasswordOpen}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" defaultChecked disabled={loading || changePasswordOpen} />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Keep me signed in
            </Label>
          </div>

          <Button type="submit" className="mt-2" disabled={loading || changePasswordOpen}>
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </AuthShell>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        if (!open && !changingPassword) {
          // Allow closing only if not in the middle of changing
          setChangePasswordOpen(false)
          setCurrentPassword("")
          setNewPassword("")
          setConfirmPassword("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="size-5 text-primary" />
              Change Password Required
            </DialogTitle>
            <DialogDescription>
              For security reasons, you must change your password before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <KeyRound className="size-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Password Change Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Please create a new password. It must be at least 6 characters long.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Current Password Field */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pr-10"
                    disabled={changingPassword}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={changingPassword}
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="pr-10"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={changingPassword}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${
                    newPassword.length === 0 ? "bg-gray-200 dark:bg-gray-700" :
                    newPassword.length < 6 ? "bg-red-400" :
                    newPassword.length < 8 ? "bg-yellow-400" :
                    "bg-green-400"
                  }`} />
                  <span className={`text-xs ${
                    newPassword.length === 0 ? "text-muted-foreground" :
                    newPassword.length < 6 ? "text-red-500" :
                    newPassword.length < 8 ? "text-yellow-500" :
                    "text-green-500"
                  }`}>
                    {newPassword.length === 0 ? "0/6" : `${newPassword.length}/6+`}
                  </span>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="pr-10"
                    disabled={changingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={changingPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="size-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword && confirmPassword === newPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="size-3" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
                // Redirect back to login
                router.push("/login")
              }}
              disabled={changingPassword}
            >
              Logout
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword || !currentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              className="flex-1"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <KeyRound className="size-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}