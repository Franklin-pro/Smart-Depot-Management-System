"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  Settings, Save, RefreshCw, Shield, Bell, 
  DollarSign, Package, Users, Printer, 
  Mail, Globe, Clock, Database, Moon, Sun,
  Monitor, Building, CreditCard, Truck,
  AlertCircle, CheckCircle, Eye, EyeOff,
  Phone, MapPin, Calendar, FileText, KeyRound,
  Edit2, X, Check
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

// Types
interface CompanySettings {
  name: string
  logo?: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  taxId: string
  currency: string
  currencySymbol: string
  receiptFooter: string
}

interface NotificationSettings {
  lowStockAlert: boolean
  lowStockThreshold: number
  expiryAlert: boolean
  expiryDays: number
  dailyReport: boolean
  weeklyReport: boolean
  monthlyReport: boolean
  reportEmail: string
}

interface InvoiceSettings {
  prefix: string
  nextNumber: number
  footer: string
  dueDays: number
  enableTax: boolean
  taxRate: number
  enableDiscount: boolean
}

interface SecuritySettings {
  sessionTimeout: number
  require2FA: boolean
  passwordExpiryDays: number
  maxLoginAttempts: number
  auditLog: boolean
}

interface BackupSettings {
  autoBackup: boolean
  backupFrequency: "daily" | "weekly" | "monthly"
  backupTime: string
  backupLocation: string
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
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await usersService.profileUser()
        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }

    fetchUser()
  }, [])

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
          <DialogTitle>Change Password</DialogTitle>
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

// Company Info Edit Modal
function CompanyInfoModal({ 
  open, 
  onOpenChange, 
  company, 
  onSave 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  company: CompanySettings
  onSave: (data: CompanySettings) => void
}) {
  const [formData, setFormData] = useState(company)

  useEffect(() => {
    setFormData(company)
  }, [company])

  const handleSubmit = () => {
    onSave(formData)
    onOpenChange(false)
    toast.success("Company information updated")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company Information</DialogTitle>
          <DialogDescription>
            Update your company details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax ID (TIN)</Label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">Rwandan Franc (RWF)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="FRw"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Receipt Footer Message</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              placeholder="Thank you for your business!"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Check className="size-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SettingsPage() {
  const { currentUser } = useApp()
  
  // Company Settings
  const [company, setCompany] = useState<CompanySettings>({
    name: "Beer Depot",
    email: "info@beerdepot.com",
    phone: "+250 788 123 456",
    address: "123 Main Street",
    city: "Kigali",
    country: "Rwanda",
    taxId: "TAX-123456",
    currency: "RWF",
    currencySymbol: "FRw",
    receiptFooter: "Thank you for your business!",
  })

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    lowStockAlert: true,
    lowStockThreshold: 40,
    expiryAlert: true,
    expiryDays: 30,
    dailyReport: true,
    weeklyReport: true,
    monthlyReport: true,
    reportEmail: "reports@beerdepot.com",
  })

  // Invoice Settings
  const [invoice, setInvoice] = useState<InvoiceSettings>({
    prefix: "INV",
    nextNumber: 1001,
    footer: "Thank you for your business!",
    dueDays: 30,
    enableTax: true,
    taxRate: 18,
    enableDiscount: true,
  })

  // Security Settings
  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeout: 30,
    require2FA: false,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    auditLog: true,
  })

  // Backup Settings
  const [backup, setBackup] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: "daily",
    backupTime: "23:00",
    backupLocation: "/backups",
  })

  // Theme Settings
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  
  // Dialog states
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    if (savedTheme) setTheme(savedTheme)
    
    const savedCompany = localStorage.getItem("companySettings")
    if (savedCompany) setCompany(JSON.parse(savedCompany))
    
    const savedNotifications = localStorage.getItem("notificationSettings")
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))
    
    const savedInvoice = localStorage.getItem("invoiceSettings")
    if (savedInvoice) setInvoice(JSON.parse(savedInvoice))
  }, [])

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(theme)
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  // Save all settings
  const handleSaveSettings = () => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem("companySettings", JSON.stringify(company))
      localStorage.setItem("notificationSettings", JSON.stringify(notifications))
      localStorage.setItem("invoiceSettings", JSON.stringify(invoice))
      localStorage.setItem("securitySettings", JSON.stringify(security))
      localStorage.setItem("backupSettings", JSON.stringify(backup))
      setSaving(false)
      toast.success("Settings saved successfully")
    }, 500)
  }

  // Handle backup
  const handleBackup = () => {
    const data = {
      company,
      notifications,
      invoice,
      security,
      backup,
      theme,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `beer-depot-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Backup created successfully")
  }

  // Handle reset
  const handleReset = () => {
    setCompany({
      name: "Beer Depot",
      email: "info@beerdepot.com",
      phone: "+250 788 123 456",
      address: "123 Main Street",
      city: "Kigali",
      country: "Rwanda",
      taxId: "TAX-123456",
      currency: "RWF",
      currencySymbol: "FRw",
      receiptFooter: "Thank you for your business!",
    })
    setNotifications({
      lowStockAlert: true,
      lowStockThreshold: 40,
      expiryAlert: true,
      expiryDays: 30,
      dailyReport: true,
      weeklyReport: true,
      monthlyReport: true,
      reportEmail: "reports@beerdepot.com",
    })
    setInvoice({
      prefix: "INV",
      nextNumber: 1001,
      footer: "Thank you for your business!",
      dueDays: 30,
      enableTax: true,
      taxRate: 18,
      enableDiscount: true,
    })
    setSecurity({
      sessionTimeout: 30,
      require2FA: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      auditLog: true,
    })
    setBackup({
      autoBackup: true,
      backupFrequency: "daily",
      backupTime: "23:00",
      backupLocation: "/backups",
    })
    toast.success("Settings reset to default")
    setResetDialogOpen(false)
  }

  // Handle company update
  const handleCompanyUpdate = (updatedCompany: CompanySettings) => {
    setCompany(updatedCompany)
    localStorage.setItem("companySettings", JSON.stringify(updatedCompany))
    toast.success("Company information updated")
  }

  return (
    <>
      <DashboardHeader 
        title="Settings" 
        description="Configure your beer depot management system"
      />

      <div className="flex flex-col gap-6 p-4 md:p-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* General Settings - Updated with Display Cards */}
          <TabsContent value="general" className="space-y-4">
            {/* Company Information Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="size-5" />
                  Company Information
                </h3>
                <Button variant="outline" size="sm" onClick={() => setCompanyModalOpen(true)}>
                  <Edit2 className="size-4 mr-2" />
                  Edit Information
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{company.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{company.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tax ID (TIN)</p>
                  <p className="font-medium">{company.taxId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{company.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{company.city}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{company.country}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{company.currency} ({company.currencySymbol})</p>
                </div>
              </div>
            </Card>

            {/* Receipt Settings Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="size-5" />
                Receipt Settings
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Receipt Footer Message</p>
                <p className="p-3 bg-muted rounded-md text-sm">{company.receiptFooter}</p>
              </div>
            </Card>
          </TabsContent>

          {/* Notification Settings - Same as before */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="size-5" />
                Alert Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when stock falls below threshold</p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlert}
                    onCheckedChange={(v) => setNotifications({ ...notifications, lowStockAlert: v })}
                  />
                </div>
                {notifications.lowStockAlert && (
                  <div className="ml-6 space-y-2">
                    <Label>Low Stock Threshold (cases)</Label>
                    <Input
                      type="number"
                      value={notifications.lowStockThreshold}
                      onChange={(e) => setNotifications({ ...notifications, lowStockThreshold: Number(e.target.value) })}
                      className="max-w-xs"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expiry Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when products are about to expire</p>
                  </div>
                  <Switch
                    checked={notifications.expiryAlert}
                    onCheckedChange={(v) => setNotifications({ ...notifications, expiryAlert: v })}
                  />
                </div>
                {notifications.expiryAlert && (
                  <div className="ml-6 space-y-2">
                    <Label>Days before expiry to alert</Label>
                    <Input
                      type="number"
                      value={notifications.expiryDays}
                      onChange={(e) => setNotifications({ ...notifications, expiryDays: Number(e.target.value) })}
                      className="max-w-xs"
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">Email Reports</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily Sales Report</span>
                    <Switch
                      checked={notifications.dailyReport}
                      onCheckedChange={(v) => setNotifications({ ...notifications, dailyReport: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly Summary Report</span>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Performance Report</span>
                    <Switch
                      checked={notifications.monthlyReport}
                      onCheckedChange={(v) => setNotifications({ ...notifications, monthlyReport: v })}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Report Email Address</Label>
                    <Input
                      type="email"
                      value={notifications.reportEmail}
                      onChange={(e) => setNotifications({ ...notifications, reportEmail: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Invoice Settings - Same as before */}
          <TabsContent value="invoicing" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Printer className="size-5" />
                Invoice Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={invoice.prefix}
                    onChange={(e) => setInvoice({ ...invoice, prefix: e.target.value })}
                    placeholder="INV"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Invoice Number</Label>
                  <Input
                    type="number"
                    value={invoice.nextNumber}
                    onChange={(e) => setInvoice({ ...invoice, nextNumber: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Days (Payment Terms)</Label>
                  <Input
                    type="number"
                    value={invoice.dueDays}
                    onChange={(e) => setInvoice({ ...invoice, dueDays: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Invoice Footer</Label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={invoice.footer}
                    onChange={(e) => setInvoice({ ...invoice, footer: e.target.value })}
                    placeholder="Thank you for your business!"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Tax</p>
                    <p className="text-sm text-muted-foreground">Apply tax to all invoices</p>
                  </div>
                  <Switch
                    checked={invoice.enableTax}
                    onCheckedChange={(v) => setInvoice({ ...invoice, enableTax: v })}
                  />
                </div>
                {invoice.enableTax && (
                  <div className="ml-6 space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={invoice.taxRate}
                      onChange={(e) => setInvoice({ ...invoice, taxRate: Number(e.target.value) })}
                      className="max-w-xs"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Discounts</p>
                    <p className="text-sm text-muted-foreground">Allow discounts on invoices</p>
                  </div>
                  <Switch
                    checked={invoice.enableDiscount}
                    onCheckedChange={(v) => setInvoice({ ...invoice, enableDiscount: v })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <KeyRound className="size-5" />
                Password Management
              </h3>
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

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="size-5" />
                Security Configuration
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
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Input
                      type="number"
                      value={security.passwordExpiryDays}
                      onChange={(e) => setSecurity({ ...security, passwordExpiryDays: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={security.maxLoginAttempts}
                      onChange={(e) => setSecurity({ ...security, maxLoginAttempts: Number(e.target.value) })}
                    />
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
              </div>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="size-5" />
                Backup Configuration
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automatic Backups</p>
                    <p className="text-sm text-muted-foreground">Schedule regular system backups</p>
                  </div>
                  <Switch
                    checked={backup.autoBackup}
                    onCheckedChange={(v) => setBackup({ ...backup, autoBackup: v })}
                  />
                </div>

                {backup.autoBackup && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select value={backup.backupFrequency} onValueChange={(v: any) => setBackup({ ...backup, backupFrequency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Backup Time (24h)</Label>
                        <Input
                          type="time"
                          value={backup.backupTime}
                          onChange={(e) => setBackup({ ...backup, backupTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBackup}>
                    <Database className="size-4 mr-2" />
                    Create Manual Backup
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Monitor className="size-5" />
                Theme Preferences
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sun className="size-8" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Moon className="size-8" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Monitor className="size-8" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save and Reset Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Company Info Edit Modal */}
      <CompanyInfoModal 
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        company={company}
        onSave={handleCompanyUpdate}
      />

      {/* Password Change Modal */}
      <ChangePasswordModal 
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onSuccess={() => {}}
      />

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to their default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}