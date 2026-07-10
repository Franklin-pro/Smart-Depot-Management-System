"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  Settings, Save, RefreshCw, Shield, 
  DollarSign, Package, Users, Printer, 
  Mail, Globe, Clock, Database, Moon, Sun,
  Monitor, Building, CreditCard, Truck,
  AlertCircle, CheckCircle, Eye, EyeOff,
  Phone, MapPin, Calendar, FileText, KeyRound,
  Edit2, X, Check, Bell, FileSpreadsheet,
  User, AtSign, Hash, UserCog, Lock,
  MailCheck, CalendarDays, Clock as ClockIcon
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usersService } from "@/services"
import { Badge } from "@/components/ui/badge"

// Report Settings Interface
interface ReportSettings {
  id?: number
  recipients: string[]
  whatsappNumber: string
  dailyEnabled: boolean
  weeklyEnabled: boolean
  monthlyEnabled: boolean
  sendHour: number
  weeklyWeekday: number
  monthlyDay: number
  lastDailySent?: string
  lastWeeklySent?: string
  lastMonthlySent?: string
  updatedAt?: string
}

// User Profile Interface
interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  phone: string
  status: string
  createdAt: string
}

// Password Change Modal Component
function ChangePasswordModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!currentPassword) {
      toast.error("Please enter current password")
      return
    }
    if (!newPassword) {
      toast.error("Please enter new password")
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
    setTimeout(() => {
      setLoading(false)
      toast.success("Password changed successfully!")
      onSuccess()
      onOpenChange(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Update your password to keep your account secure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <RefreshCw className="size-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="size-4 mr-2" />
              )}
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SettingsPage() {
  const { currentUser } = useApp()
  
  // Report Settings
  const [reportSettings, setReportSettings] = useState<ReportSettings>({
    recipients: [],
    whatsappNumber: "",
    dailyEnabled: true,
    weeklyEnabled: true,
    monthlyEnabled: true,
    sendHour: 23,
    weeklyWeekday: 6,
    monthlyDay: 1
  })

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 0,
    name: "",
    email: "",
    role: "",
    phone: "",
    status: "",
    createdAt: ""
  })

  // Security Settings
  const [security, setSecurity] = useState({
    sessionTimeout: 30,
    require2FA: false,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    auditLog: true,
  })

  // UI States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recipientInput, setRecipientInput] = useState("")

  // Check if any report is enabled
  const hasAnyReportEnabled = reportSettings.dailyEnabled || reportSettings.weeklyEnabled || reportSettings.monthlyEnabled

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch report settings
        const reportData = await usersService.getSettings()
        if (reportData) {
          setReportSettings({
            id: reportData.id,
            recipients: reportData.recipients || [],
            whatsappNumber: reportData.whatsappNumber || "",
            dailyEnabled: reportData.dailyEnabled ?? true,
            weeklyEnabled: reportData.weeklyEnabled ?? true,
            monthlyEnabled: reportData.monthlyEnabled ?? true,
            sendHour: reportData.sendHour ?? 23,
            weeklyWeekday: reportData.weeklyWeekday ?? 6,
            monthlyDay: reportData.monthlyDay ?? 1,
            lastDailySent: reportData.lastDailySent,
            lastWeeklySent: reportData.lastWeeklySent,
            lastMonthlySent: reportData.lastMonthlySent,
            updatedAt: reportData.updatedAt
          })
        }

        // Fetch user profile
        const userData:any = await usersService.profileUser()
        if (userData) {
          setUserProfile({
            id: userData.id || 0 ,
            name: userData.name || "",
            email: userData.email || "",
            role: userData.role || "",
            phone: userData.phone || "",
            status: userData.status || "",
            createdAt: userData.createdAt || new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Add recipient
  const addRecipient = () => {
    if (!recipientInput.trim()) {
      toast.error("Please enter an email address")
      return
    }
    if (!recipientInput.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (reportSettings.recipients.includes(recipientInput.trim())) {
      toast.error("Email already added")
      return
    }
    setReportSettings({
      ...reportSettings,
      recipients: [...reportSettings.recipients, recipientInput.trim()]
    })
    setRecipientInput("")
  }

  // Remove recipient
  const removeRecipient = (email: string) => {
    setReportSettings({
      ...reportSettings,
      recipients: reportSettings.recipients.filter(r => r !== email)
    })
  }

  // Save report settings
  const handleSaveReportSettings = async () => {
    setSaving(true)
    try {
      await usersService.editReportSettings({
        recipients: reportSettings.recipients,
        whatsappNumber: reportSettings.whatsappNumber,
        dailyEnabled: reportSettings.dailyEnabled,
        weeklyEnabled: reportSettings.weeklyEnabled,
        monthlyEnabled: reportSettings.monthlyEnabled,
        sendHour: reportSettings.sendHour,
        weeklyWeekday: reportSettings.weeklyWeekday,
        monthlyDay: reportSettings.monthlyDay
      })
      toast.success("Report settings saved successfully")
    } catch (error) {
      console.error('Failed to save report settings:', error)
      toast.error('Failed to save report settings')
    } finally {
      setSaving(false)
    }
  }

  // Get role badge
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      admin: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      cashier: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      storekeeper: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    }
    return <Badge className={colors[role] || "bg-gray-100"}>{role || "Unknown"}</Badge>
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">Inactive</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspended</Badge>
      default:
        return <Badge>{status || "Unknown"}</Badge>
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <DashboardHeader 
          title="Settings" 
          description="Configure your system settings"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader 
        title="Settings" 
        description="Configure your system settings"
      />

      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="profile">
              <User className="size-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileSpreadsheet className="size-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="size-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserCog className="size-5" />
                Profile Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="size-3" />
                    Full Name
                  </p>
                  <p className="font-medium">{userProfile.name || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AtSign className="size-3" />
                    Email Address
                  </p>
                  <p className="font-medium">{userProfile.email || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    Phone Number
                  </p>
                  <p className="font-medium">{userProfile.phone || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Hash className="size-3" />
                    User ID
                  </p>
                  <p className="font-medium">#{userProfile.id || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Shield className="size-3" />
                    Role
                  </p>
                  <div>{getRoleBadge(userProfile.role)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    Status
                  </p>
                  <div>{getStatusBadge(userProfile.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Member Since
                  </p>
                  <p className="font-medium">
                    {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <Button onClick={() => setPasswordModalOpen(true)}>
                  <KeyRound className="size-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="size-5" />
                  Report Settings
                </h3>
                <Button 
                  onClick={handleSaveReportSettings} 
                  disabled={saving || !hasAnyReportEnabled}
                  title={!hasAnyReportEnabled ? "Enable at least one report type to save" : ""}
                >
                  {saving ? (
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>

              <div className="space-y-6">
                {/* Email Recipients */}
                <div className="space-y-3">
                  <Label className="font-medium">Email Recipients</Label>
                  <p className="text-sm text-muted-foreground">
                    Add email addresses to receive automated reports
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addRecipient()
                        }
                      }}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      <Mail className="size-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {reportSettings.recipients.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {reportSettings.recipients.map((email, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          <Mail className="size-3" />
                          {email}
                          <button
                            onClick={() => removeRecipient(email)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      No recipients added yet
                    </p>
                  )}
                </div>

                <Separator />

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label className="font-medium">WhatsApp Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Phone number for WhatsApp notifications
                  </p>
                  <Input
                    value={reportSettings.whatsappNumber}
                    onChange={(e) => setReportSettings({ ...reportSettings, whatsappNumber: e.target.value })}
                    placeholder="+250 788 123 456"
                    className="max-w-md"
                  />
                </div>

                <Separator />

                {/* Schedule Settings */}
                <div className="space-y-4">
                  <Label className="font-medium">Report Schedule</Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Daily Reports</p>
                        <p className="text-sm text-muted-foreground">Send daily summary reports</p>
                      </div>
                      <Switch
                        checked={reportSettings.dailyEnabled}
                        onCheckedChange={(v) => setReportSettings({ ...reportSettings, dailyEnabled: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Reports</p>
                        <p className="text-sm text-muted-foreground">Send weekly summary reports</p>
                      </div>
                      <Switch
                        checked={reportSettings.weeklyEnabled}
                        onCheckedChange={(v) => setReportSettings({ ...reportSettings, weeklyEnabled: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Monthly Reports</p>
                        <p className="text-sm text-muted-foreground">Send monthly summary reports</p>
                      </div>
                      <Switch
                        checked={reportSettings.monthlyEnabled}
                        onCheckedChange={(v) => setReportSettings({ ...reportSettings, monthlyEnabled: v })}
                      />
                    </div>
                  </div>
                </div>

                {/* Only show schedule details if at least one report is enabled */}
                {hasAnyReportEnabled && (
                  <>
                    <Separator />

                    {/* Schedule Details */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Send Hour (24h)</Label>
                        <Select 
                          value={String(reportSettings.sendHour)} 
                          onValueChange={(v) => setReportSettings({ ...reportSettings, sendHour: Number(v) })}
                          disabled={!hasAnyReportEnabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i}:00 {i < 12 ? "AM" : "PM"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!hasAnyReportEnabled && (
                          <p className="text-xs text-muted-foreground text-amber-600">
                            Enable at least one report type to configure
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Weekly Day</Label>
                        <Select 
                          value={String(reportSettings.weeklyWeekday)} 
                          onValueChange={(v) => setReportSettings({ ...reportSettings, weeklyWeekday: Number(v) })}
                          disabled={!reportSettings.weeklyEnabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                        {!reportSettings.weeklyEnabled && (
                          <p className="text-xs text-muted-foreground text-amber-600">
                            Enable weekly reports to configure
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Monthly Day</Label>
                        <Select 
                          value={String(reportSettings.monthlyDay)} 
                          onValueChange={(v) => setReportSettings({ ...reportSettings, monthlyDay: Number(v) })}
                          disabled={!reportSettings.monthlyEnabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => (
                              <SelectItem key={i} value={String(i + 1)}>
                                Day {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!reportSettings.monthlyEnabled && (
                          <p className="text-xs text-muted-foreground text-amber-600">
                            Enable monthly reports to configure
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Show message when no reports are enabled */}
                {!hasAnyReportEnabled && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300">No Reports Enabled</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Enable at least one report type (Daily, Weekly, or Monthly) to configure the schedule settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Sent Information - Only show if reports are enabled */}
                {hasAnyReportEnabled && reportSettings.updatedAt && (
                  <>
                    <Separator />
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          Last Daily Sent
                        </p>
                        <p className="text-sm font-medium">
                          {reportSettings.lastDailySent ? new Date(reportSettings.lastDailySent).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          Last Weekly Sent
                        </p>
                        <p className="text-sm font-medium">
                          {reportSettings.lastWeeklySent ? new Date(reportSettings.lastWeeklySent).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MailCheck className="size-3" />
                          Last Monthly Sent
                        </p>
                        <p className="text-sm font-medium">
                          {reportSettings.lastMonthlySent ? new Date(reportSettings.lastMonthlySent).toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="size-5" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time before auto-logout due to inactivity
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Input
                      type="number"
                      value={security.passwordExpiryDays}
                      onChange={(e) => setSecurity({ ...security, passwordExpiryDays: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days before password must be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={security.maxLoginAttempts}
                      onChange={(e) => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Failed attempts before account lockout
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Extra security for user accounts</p>
                  </div>
                  <Switch
                    checked={security.require2FA}
                    onCheckedChange={(v) => setSecurity({ ...security, require2FA: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Audit Logging</p>
                    <p className="text-sm text-muted-foreground">Track all user actions and changes</p>
                  </div>
                  <Switch
                    checked={security.auditLog}
                    onCheckedChange={(v) => setSecurity({ ...security, auditLog: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Force Password Change</p>
                    <p className="text-sm text-muted-foreground">Require users to change password on next login</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Force Now
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal 
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onSuccess={() => {}}
      />
    </>
  )
}