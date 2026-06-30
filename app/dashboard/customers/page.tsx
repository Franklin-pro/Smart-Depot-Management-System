"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  ArrowLeft, RefreshCw, CheckCircle, Clock, AlertCircle, Package, Plus, 
  Download, FileText, TrendingUp, AlertTriangle, DollarSign, Users, 
  Calendar, Search, Filter, MoreHorizontal, Eye, Edit2, Trash2, X,
  BarChart3, PieChart, Phone, Mail, MapPin, Building2, UserPlus
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"
import type { Customer, EmptyCaseTransaction, TransactionType } from "@/lib/types"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { customersService } from "@/services"

// ============================================
// FORM COMPONENTS
// ============================================

function CustomerForm({ 
  customer, 
  onSubmit, 
  onCancel,
  isEditing = false,
}: { 
  customer?: Customer
  onSubmit: (data: any) => void
  onCancel: () => void
  isEditing?: boolean
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    city: customer?.city || "",
    type: customer?.type || "retail",
    notes: customer?.notes || "",
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <Label>Customer Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v: "retail" | "wholesale") => 
              setFormData({ ...formData, type: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter street address"
        />
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="Enter city"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this customer..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSubmit(formData)}
          disabled={!formData.name || !formData.phone}
        >
          {isEditing ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CustomersPage() {
  const { 
    currentUser, 
    customers, 
    emptyCaseTransactions,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setCustomers,
  } = useApp()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load customers from API on mount
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await customersService.getAll()
        setCustomers(data)
      } catch (err) {
        console.error('Failed to load customers:', err)
        setError('Failed to load customers from server')
        toast.error('Failed to load customers')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [setCustomers])

  // API CRUD operations
  const handleAddCustomer = async (data: any) => {
    setIsLoading(true)
    try {
      const newCustomer = await customersService.create(data)
      await addCustomer(newCustomer)
      toast.success('Customer added successfully')
      return newCustomer
    } catch (err) {
      console.error('Failed to add customer:', err)
      toast.error('Failed to add customer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCustomer = async (id: string, data: any) => {
    setIsLoading(true)
    try {
      const updated = await customersService.update(id, data)
      // Fix: Pass both id and the updated data
      await updateCustomer(id, updated)
      toast.success('Customer updated successfully')
      return updated
    } catch (err) {
      console.error('Failed to update customer:', err)
      toast.error('Failed to update customer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    setIsLoading(true)
    try {
      await customersService.delete(id)
      await deleteCustomer(id)
      toast.success('Customer deleted successfully')
    } catch (err) {
      console.error('Failed to delete customer:', err)
      toast.error('Failed to delete customer')
    } finally {
      setIsLoading(false)
    }
  }

  const [query, setQuery] = useState("")
  // Fix: Remove "corporate" from the filter type
  const [typeFilter, setTypeFilter] = useState<"all" | "retail" | "wholesale">("all")
  const [activeTab, setActiveTab] = useState("customers")
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
                        c.phone?.toLowerCase().includes(query.toLowerCase()) ||
                        c.email?.toLowerCase().includes(query.toLowerCase()) ||
                        c.city?.toLowerCase().includes(query.toLowerCase())
      
      const matchType = typeFilter === "all" || c.type === typeFilter
      
      return matchQuery && matchType
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [customers, query, typeFilter])

  // Calculate customer statistics with related transactions
  const customerStats = useMemo(() => {
    const totalCustomers = customers.length
    const customersWithTransactions = customers.filter(c => 
      emptyCaseTransactions.some(t => t.customerId === c.id)
    ).length
    
    // Aggregate transaction data by customer
    const transactionSummary = customers.map(c => {
      const transactions = emptyCaseTransactions.filter(t => t.customerId === c.id)
      const totalDeposits = transactions.reduce((sum, t) => sum + t.totalDepositValue, 0)
      const totalRefunded = transactions.reduce((sum, t) => sum + t.refundedAmount, 0)
      const pendingDeposits = transactions.reduce((sum, t) => sum + (t.pendingQuantity * t.depositAmount), 0)
      const totalTransactions = transactions.length
      const pendingTransactions = transactions.filter(t => t.pendingQuantity > 0).length
      
      return {
        ...c,
        totalDeposits,
        totalRefunded,
        pendingDeposits,
        totalTransactions,
        pendingTransactions,
      }
    })

    const totalPendingDeposits = transactionSummary.reduce((sum, c) => sum + c.pendingDeposits, 0)
    const totalRefundedAmount = transactionSummary.reduce((sum, c) => sum + c.totalRefunded, 0)
    const activeCustomers = transactionSummary.filter(c => c.totalTransactions > 0).length

    return {
      totalCustomers,
      customersWithTransactions,
      activeCustomers,
      totalPendingDeposits,
      totalRefundedAmount,
      transactionSummary,
    }
  }, [customers, emptyCaseTransactions])

  // Chart colors
  const chartColors = {
    retail: "#3b82f6",
    wholesale: "#8b5cf6",
    pending: "#f59e0b",
    refunded: "#10b981",
  }

  // Status badge helper - Remove corporate
  const getTypeBadge = (type: string) => {
    const config = {
      retail: { label: "Retail", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      wholesale: { label: "Wholesale", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    }
    const c = config[type as keyof typeof config]
    if (!c) return <Badge>{type}</Badge>
    return <Badge className={c.className}>{c.label}</Badge>
  }

  // Export functionality
  const handleExport = (format: "csv" | "excel") => {
    const data = filteredCustomers.map(c => {
      const stats = customerStats.transactionSummary.find(s => s.id === c.id)
      return {
        Name: c.name,
        Phone: c.phone || "-",
        Email: c.email || "-",
        City: c.city || "-",
        Type: c.type,
        "Total Transactions": stats?.totalTransactions || 0,
        "Pending Deposits": formatCurrency(stats?.pendingDeposits || 0),
        "Total Refunded": formatCurrency(stats?.totalRefunded || 0),
      }
    })

    if (format === "csv") {
      const headers = Object.keys(data[0]).join(",")
      const rows = data.map(row => Object.values(row).join(","))
      const csv = [headers, ...rows].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV exported successfully")
    }
  }

  // Show loading state
  if (isLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4 md:p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage customer accounts, deposits, and transactions</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="size-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Customers</p>
                <p className="text-xl font-bold">{customerStats.totalCustomers}</p>
              </div>
              <Users className="size-6 text-blue-500 dark:text-blue-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Customers</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{customerStats.activeCustomers}</p>
              </div>
              <CheckCircle className="size-6 text-green-500 dark:text-green-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Deposits</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(customerStats.totalPendingDeposits)}</p>
              </div>
              <Clock className="size-6 text-yellow-500 dark:text-yellow-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Refunded</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(customerStats.totalRefundedAmount)}</p>
              </div>
              <DollarSign className="size-6 text-emerald-500 dark:text-emerald-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">With Deposits</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{customerStats.customersWithTransactions}</p>
              </div>
              <Package className="size-6 text-purple-500 dark:text-purple-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Retail / Wholesale</p>
                <p className="text-xl font-bold">
                  {customers.filter(c => c.type === "retail").length} / {customers.filter(c => c.type === "wholesale").length}
                </p>
              </div>
              <Building2 className="size-6 text-cyan-500 dark:text-cyan-400" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="size-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTab === "customers" && (
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="size-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>
                        Create a new customer account
                      </DialogDescription>
                    </DialogHeader>
                    <CustomerForm 
                      onSubmit={async (data) => {
                        try {
                          await handleAddCustomer(data)
                          setAddDialogOpen(false)
                        } catch (error) {
                          // Error already handled
                        }
                      }}
                      onCancel={() => setAddDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {/* Fix: Remove corporate from filter options */}
                <Select value={typeFilter} onValueChange={(v: "all" | "retail" | "wholesale") => setTypeFilter(v)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Pending Deposits</TableHead>
                      <TableHead className="text-right">Total Refunded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => {
                      const stats = customerStats.transactionSummary.find(s => s.id === customer.id)
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.name}</span>
                              {customer.notes && (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {customer.notes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              {customer.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" />
                                  {customer.phone}
                                </span>
                              )}
                              {customer.email && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="size-3" />
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(customer.type)}</TableCell>
                          <TableCell>{customer.city || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {stats?.totalTransactions || 0}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600 dark:text-yellow-400 font-medium">
                            {formatCurrency(stats?.pendingDeposits || 0)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(stats?.totalRefunded || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setViewDialogOpen(true)
                                }}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteCustomer(customer.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center">
                          <Users className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No customers found</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setAddDialogOpen(true)}
                          >
                            <UserPlus className="size-4 mr-2" />
                            Add your first customer
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Customer Type Distribution - Remove corporate */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="size-5" />
                  Customer Type Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Retail", value: customers.filter(c => c.type === "retail").length, color: chartColors.retail },
                        { name: "Wholesale", value: customers.filter(c => c.type === "wholesale").length, color: chartColors.wholesale },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { color: chartColors.retail },
                        { color: chartColors.wholesale },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>

              {/* Top Customers by Deposits */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Top Customers by Deposits
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={customerStats.transactionSummary
                      .sort((a, b) => b.pendingDeposits - a.pendingDeposits)
                      .slice(0, 8)
                    }
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis 
                      type="number"
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="pendingDeposits" fill={chartColors.pending} name="Pending Deposits" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Customer Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="size-5" />
                  Customer Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerStats.transactionSummary.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalTransactions" fill={chartColors.retail} name="Transactions" />
                    <Bar dataKey="pendingTransactions" fill={chartColors.pending} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Deposit vs Refund */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="size-5" />
                  Deposit vs Refund by Customer
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerStats.transactionSummary.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pendingDeposits" fill={chartColors.pending} name="Pending Deposits" />
                    <Bar dataKey="totalRefunded" fill={chartColors.refunded} name="Total Refunded" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Transactions / Customer</p>
                    <p className="text-2xl font-bold">
                      {customerStats.totalCustomers > 0 
                        ? (customerStats.customersWithTransactions / customerStats.totalCustomers * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Deposit / Customer</p>
                    <p className="text-2xl font-bold">
                      {customerStats.totalCustomers > 0 
                        ? formatCurrency(customerStats.totalPendingDeposits / customerStats.totalCustomers) 
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Building2 className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wholesale Share</p>
                    <p className="text-2xl font-bold">
                      {customerStats.totalCustomers > 0 
                        ? (customers.filter(c => c.type === "wholesale").length / customerStats.totalCustomers * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Package className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">With Active Deposits</p>
                    <p className="text-2xl font-bold">
                      {customerStats.customersWithTransactions}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total Transactions</TableHead>
                      <TableHead className="text-right">Pending Cases</TableHead>
                      <TableHead className="text-right">Pending Deposits</TableHead>
                      <TableHead className="text-right">Total Refunded</TableHead>
                      <TableHead className="text-right">Return Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerStats.transactionSummary
                      .filter(s => s.totalTransactions > 0)
                      .sort((a, b) => b.pendingDeposits - a.pendingDeposits)
                      .map((stats) => {
                        const totalCases = emptyCaseTransactions
                          .filter(t => t.customerId === stats.id)
                          .reduce((sum, t) => sum + t.totalQuantity, 0)
                        const returnedCases = emptyCaseTransactions
                          .filter(t => t.customerId === stats.id)
                          .reduce((sum, t) => sum + t.returnedQuantity, 0)
                        const returnRate = totalCases > 0 ? (returnedCases / totalCases) * 100 : 0

                        return (
                          <TableRow key={stats.id}>
                            <TableCell className="font-medium">{stats.name}</TableCell>
                            <TableCell>{getTypeBadge(stats.type)}</TableCell>
                            <TableCell className="text-right">{stats.totalTransactions}</TableCell>
                            <TableCell className="text-right">
                              {emptyCaseTransactions
                                .filter(t => t.customerId === stats.id)
                                .reduce((sum, t) => sum + t.pendingQuantity, 0)}
                            </TableCell>
                            <TableCell className="text-right text-yellow-600 dark:text-yellow-400 font-medium">
                              {formatCurrency(stats.pendingDeposits)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                              {formatCurrency(stats.totalRefunded)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={returnRate > 80 ? "default" : returnRate > 50 ? "secondary" : "destructive"}>
                                {returnRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    {customerStats.transactionSummary.filter(s => s.totalTransactions > 0).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <Package className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No deposit transactions found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Customer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View customer information and transaction summary
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p>{getTypeBadge(selectedCustomer.type)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p>{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p>{selectedCustomer.email || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p>{selectedCustomer.address || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">City</p>
                  <p>{selectedCustomer.city || "-"}</p>
                </div>
                {selectedCustomer.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Transaction Summary</h4>
                {(() => {
                  const stats = customerStats.transactionSummary.find(s => s.id === selectedCustomer.id)
                  return (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Transactions:</span>
                        <span className="ml-2 font-medium">{stats?.totalTransactions || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending Deposits:</span>
                        <span className="ml-2 font-medium text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(stats?.pendingDeposits || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Refunded:</span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(stats?.totalRefunded || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending Transactions:</span>
                        <span className="ml-2 font-medium">{stats?.pendingTransactions || 0}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm 
              customer={selectedCustomer}
              isEditing={true}
              onSubmit={async (data) => {
                try {
                  await handleUpdateCustomer(selectedCustomer.id, data)
                  setEditDialogOpen(false)
                  setSelectedCustomer(null)
                } catch (error) {
                  // Error already handled
                }
              }}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedCustomer(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}