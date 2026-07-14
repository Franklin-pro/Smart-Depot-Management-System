"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { 
  Users, Plus, Search, Edit2, Trash2, Eye, 
  Mail, Phone, MapPin, Calendar, DollarSign, 
  Shield, Clock, CheckCircle, XCircle, Download,
  Filter, MoreHorizontal, UserPlus, UserCheck,
  Building, Briefcase, CreditCard, Award,
  FileText, Printer, RefreshCw, AlertCircle,
  Upload, File, FileImage, FileArchive, X,
  Crown, UserCog, Users2
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { usersService } from "@/services"
import type { Role, User, UserStatus } from "@/lib/types"

type UserRole = Role

// Create User Modal
function CreateUserModal({ 
  open, 
  onOpenChange, 
  onCreate 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (data: any) => Promise<User | undefined>
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier" as UserRole,
    phone: "",
    status: "active" as UserStatus
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    // Reset error
    setError(null)
    
    // Validate
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return
    }
    
    setIsLoading(true)
    try {
      await onCreate(formData)
      // Reset form on success
      setFormData({
        name: "",
        email: "",
        role: "cashier",
        phone: "",
        status: "active"
      })
      onOpenChange(false)
    } catch (error) {
      // Error is already handled in the parent
      setError(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isLoading) {
        setError(null)
        onOpenChange(open)
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with specific role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+250 788 123 456"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="storekeeper">Storekeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v: UserStatus) => setFormData({ ...formData, status: v })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Edit User Modal
function EditUserModal({ 
  open, 
  onOpenChange, 
  user,
  onUpdate
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onUpdate: (data: any) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier" as UserRole,
    phone: "",
    status: "active" as UserStatus
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        phone: user.phone,
        status: user.status
      })
    }
  }, [user])

  const handleSubmit = async () => {
    setError(null)
    
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    
    setIsLoading(true)
    try {
      await onUpdate(formData)
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isLoading) {
        setError(null)
        onOpenChange(open)
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="size-5 text-primary" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+250 788 123 456"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="storekeeper">Storekeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v: UserStatus) => setFormData({ ...formData, status: v })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 className="size-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const { currentUser, users, addUser, updateUser, deleteUser, setUsers } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [userList, setUserList] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)

  // ✅ Fetch users from API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const data = await usersService.getAll()
        // Map API response to User type
        const usersData: User[] = data.map((u: any) => ({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          role: u.role || 'cashier',
          phone: u.phone || '',
          status: u.status || 'active',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString()
        }))
        setUserList(usersData)
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [setUsers])

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = userList

    if (query) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.phone.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter)
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [userList, query, roleFilter, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = userList.length
    const active = userList.filter(u => u.status === "active").length
    const inactive = userList.filter(u => u.status === "inactive").length
    const suspended = userList.filter(u => u.status === "suspended").length
    
    const owners = userList.filter(u => u.role === "owner").length
    const managers = userList.filter(u => u.role === "manager").length
    const admins = userList.filter(u => u.role === "admin").length
    const cashiers = userList.filter(u => u.role === "cashier").length
    const storekeepers = userList.filter(u => u.role === "storekeeper").length

    return {
      total,
      active,
      inactive,
      suspended,
      owners,
      managers,
      admins,
      cashiers,
      storekeepers,
    }
  }, [userList])

  // Handle create user - Direct API call
  const handleCreateUser = async (data: any) => {
    try {
      // Validate required fields
      if (!data.name?.trim() || !data.email?.trim() || !data.role) {
        toast.error('Name, email, and role are required')
        return
      }

      // Call API directly via usersService
      const response = await usersService.create({
        ...data,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
      })

      // Check if user was created successfully
      if (!response) {
        throw new Error('No response from server')
      }

      if (!response.id) {
        console.error('User created but missing ID:', response)
        throw new Error('User created but ID was not returned')
      }

      // Create the user object for local state
      const userData: User = {
        id: response.id,
        name: response.name || data.name,
        email: response.email || data.email,
        role: response.role || data.role,
        phone: response.phone || data.phone || '',
        status: response.status || data.status || 'active',
        createdAt: response.createdAt || new Date().toISOString()
      }

      // Update local state
      setUserList(prev => [userData, ...prev])
      
      // Show success message
      toast.success(`User "${userData.name}" created successfully`)
      
      return userData
      
    } catch (error) {
      console.error('Error in handleCreateUser:', error)
      
      // Show user-friendly error message
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to create user. Please try again.'
      
      toast.error(message)
      throw error // Re-throw for the modal to handle
    }
  }

  // Handle update user
  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return
    
    try {
      // Call API directly
      const response = await usersService.update(editingUser.id, data)
      
      if (!response) {
        throw new Error('No response from server')
      }
      
      const updatedUser: any = {
        ...editingUser,
        name: data.name || editingUser.name,
        email: data.email || editingUser.email,
        role: data.role || editingUser.role,
        phone: data.phone || editingUser.phone,
        status: data.status || editingUser.status,
        updatedAt: response.updatedAt || new Date().toISOString()
      }
      
      // Update local state
      setUserList(userList.map(u => u.id === editingUser.id ? updatedUser : u))
      
      // Update store
      await updateUser(editingUser.id, updatedUser)
      
      setEditingUser(null)
      toast.success("User updated successfully")
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
      throw error
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    try {
      // Call API directly
      await usersService.delete(deletingUser.id)
      
      // Update local state
      setUserList(userList.filter(u => u.id !== deletingUser.id))
      
      // Update store
      await deleteUser(deletingUser.id)
      
      setDeletingUser(null)
      toast.success("User removed successfully")
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  // Export CSV
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error("No users to export")
      return
    }

    const data = filteredUsers.map(u => ({
      "Name": u.name,
      "Email": u.email,
      "Phone": u.phone,
      "Role": u.role,
      "Status": u.status,
      "Created At": formatDate(u.createdAt)
    }))

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Users exported")
  }

  // Get status badge
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">Inactive</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspended</Badge>
    }
  }

  // Get role badge
  const getRoleBadge = (role: User["role"]) => {
    const colors: Record<Role, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      admin: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      cashier: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      storekeeper: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      staff: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
    }
    return <Badge className={colors[role] ?? "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400"}>{role}</Badge>
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader 
          title="User Management" 
          description="Manage users, roles, and permissions"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader 
        title="User Management" 
        description="Manage users, roles, and permissions"
      />
      
      <div className="flex flex-wrap justify-end gap-2 px-4 md:px-6 pt-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="size-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="size-6 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <XCircle className="size-6 text-gray-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <AlertCircle className="size-6 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Owners</p>
                <p className="text-2xl font-bold text-purple-600">{stats.owners}</p>
              </div>
              <Crown className="size-6 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
              </div>
              <UserCog className="size-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cashiers</p>
                <p className="text-2xl font-bold text-green-600">{stats.cashiers}</p>
              </div>
              <Users2 className="size-6 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storekeepers</p>
                <p className="text-2xl font-bold text-orange-600">{stats.storekeepers}</p>
              </div>
              <Building className="size-6 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(v: UserRole | "all") => setRoleFilter(v)}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="storekeeper">Storekeeper</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: UserStatus | "all") => setStatusFilter(v)}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.role === "owner" ? "bg-yellow-50/30 dark:bg-yellow-950/10" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className={`text-xs ${user.role === "owner" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : ""}`}>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {user.name}
                            {user.role === "owner" && (
                              <Crown className="size-3 text-yellow-500" />
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeletingUser(user)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Users className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No users found</p>
                      <Button 
                        variant="link" 
                        onClick={() => setCreateOpen(true)}
                        className="mt-2"
                      >
                        Add your first user
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Create User Dialog */}
      <CreateUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreateUser}
      />

      {/* Edit User Dialog */}
      <EditUserModal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onUpdate={handleUpdateUser}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={(o) => !o && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}