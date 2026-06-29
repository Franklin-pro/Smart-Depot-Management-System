"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { useApp } from "@/lib/store"
import { roleLandingPage } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usersService } from "@/services"
import type { Role } from "@/lib/types"

type UserRole = "owner" | "manager" | "cashier" | "storekeeper" | "admin" | "staff"

const roles: { value: UserRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "cashier", label: "Cashier" },
  { value: "storekeeper", label: "Storekeeper" },
  { value: "staff", label: "Staff" },
]

export default function SignupPage() {
  const router = useRouter()
  const { login } = useApp()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "staff" as UserRole,
    termsAccepted: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRoleChange = (value: UserRole) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!formData.termsAccepted) {
      toast.error("Please accept the terms and conditions")
      return
    }

    setLoading(true)

    try {
      // Create user data with the exact format your API expects
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      }

      console.log("Sending user data:", userData)

      // Call the signup API
      const response:any = await usersService.signup(userData)
      
      console.log("Signup response:", response)

      // Store the access token
      if (response.accessToken) {
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('tokenType', response.tokenType || 'bearer')
      }

      // Get user data from response
      const user = response.user || response

      // Update app state with user
      login(user.email, formData.password)

      toast.success(`Welcome ${user.name}! Your account has been created.`)
      
      // Redirect based on user role
      const userRole = user.role as Role
      const redirectPath = roleLandingPage[userRole] || '/dashboard'
      router.push(redirectPath)

    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
        <p className="text-sm text-muted-foreground">
          Join Beer Depot and start managing your inventory today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              className="pl-9"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@beerdepot.com"
              className="pl-9"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+250 788 123 456"
              className="pl-9"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role *</Label>
          <Select 
            value={formData.role} 
            onValueChange={handleRoleChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min 6 characters"
              className="pl-9"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="pl-9"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {formData.password && formData.confirmPassword && (
            <p className={`text-xs ${formData.password === formData.confirmPassword ? "text-green-600" : "text-red-600"}`}>
              {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="terms"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => 
              setFormData((prev) => ({ ...prev, termsAccepted: checked as boolean }))
            }
            disabled={loading}
          />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-tight">
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button type="submit" className="mt-2" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin mr-2" />}
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}