"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { 
  Users, Plus, Search, Edit2, Trash2, Eye, 
  Mail, Phone, MapPin, Calendar, DollarSign, 
  TrendingUp, Package, Receipt, Download,
  Wallet, History, Star
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Customer } from "@/lib/types"
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

// Customer type definition
type CustomerType = "retail" | "wholesale" | "distributor" | "bar" | "hotel"

// UI Customer type - separate from store Customer type
interface UICustomer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  type: CustomerType
  totalSpent: number
  totalTransactions: number
  pendingEmpties: number
  totalPurchases: number
  refundableDeposits: number
  unpaidBalance: number
  createdAt: string
  updatedAt: string
  // UI-only fields
  city: string
  notes: string
  // Computed fields for display
  computedTotalSpent?: number
  computedTotalTransactions?: number
  computedAvgOrderValue?: number
  computedPendingReturns?: number
  computedDepositValue?: number
}

// Customer Form Component
function CustomerForm({ 
  onSubmit, 
  onCancel,
  initial,
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  initial?: UICustomer
}) {
  const [formData, setFormData] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    address: initial?.address || "",
    city: initial?.city || "",
    type: initial?.type || "retail" as CustomerType,
    notes: initial?.notes || "",
  })

  const customerTypes: { value: CustomerType; label: string }[] = [
    { value: "retail", label: "Retail Customer" },
    { value: "wholesale", label: "Wholesale Customer" },
    { value: "distributor", label: "Distributor" },
    { value: "bar", label: "Bar/Restaurant" },
    { value: "hotel", label: "Hotel/Lodge" },
  ]

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Customer name"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+250 788 123 456"
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
            placeholder="customer@example.com"
          />
        </div>
        <div className="space-y-2 w-full">
          <Label>Customer Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v: CustomerType) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customerTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street address"
        />
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="City"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the customer..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {initial ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </div>
  )
}

// Customer Details Modal
function CustomerDetailsModal({ customer, onClose }: { customer: UICustomer | null; onClose: () => void }) {
  const { sales = [], emptyCaseTransactions = [] } = useApp()
  
  if (!customer) return null

  const getInitials = () => {
    return customer.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      retail: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      wholesale: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      distributor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      bar: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      hotel: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    }
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>
  }

  // Get customer purchase history
  const customerSales = (sales || []).filter((s: any) => s.customerId === customer.id && s.status === "completed")
  const totalSpent = customerSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
  const totalTransactions = customerSales.length
  const avgOrderValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0

  // Get empty case transactions
  const customerEmptyCases = (emptyCaseTransactions || []).filter((t: any) => t.customerId === customer.id)
  const totalEmptyCases = customerEmptyCases.reduce((sum: number, t: any) => sum + (t.totalQuantity || 0), 0)
  const pendingReturns = customerEmptyCases.reduce((sum: number, t: any) => sum + (t.pendingQuantity || 0), 0)
  const depositValue = customerEmptyCases.reduce((sum: number, t: any) => sum + (t.totalDepositValue || 0), 0)

  // Recent transactions
  const recentTransactions = customerSales.slice(0, 5).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>Complete customer information and activity</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                {getTypeBadge(customer.type)}
              </div>
              <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                {customer.phone && <span>📞 {customer.phone}</span>}
                {customer.email && <span>✉️ {customer.email}</span>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics Cards */}
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-lg font-bold">{totalTransactions}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                  <p className="text-lg font-bold">{formatCurrency(avgOrderValue)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Empty Cases</p>
                  <p className="text-lg font-bold">{pendingReturns} pending</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="size-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p>{customer.phone || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p>{customer.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p>{customer.address || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">City:</span>
                <p>{customer.city || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Empty Case Summary */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="size-4" />
              Empty Cases Summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalEmptyCases}</p>
                <p className="text-xs text-muted-foreground">Total Cases</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{pendingReturns}</p>
                <p className="text-xs text-muted-foreground">Pending Returns</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(depositValue)}</p>
                <p className="text-xs text-muted-foreground">Deposit Value</p>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Recent Transactions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <History className="size-4" />
              Recent Transactions
            </h3>
            {recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            <p>Customer since: {formatDate(customer.createdAt)}</p>
            <p>Last updated: {formatDate(customer.updatedAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CustomersPage() {
  const { customers = [], sales = [], emptyCaseTransactions = [] } = useApp()
  
  // Convert store customers to UI customers
  const [customerList, setCustomerList] = useState<UICustomer[]>(() => {
    return (customers || []).map(c => ({ 
      ...c,
      type: (c.type as CustomerType) || "retail",
      city: "",
      notes: "",
    }))
  })
  
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "spent" | "transactions" | "pending">("name")
  const [addOpen, setAddOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<UICustomer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<UICustomer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<UICustomer | null>(null)

  // Calculate customer statistics (computed fields)
  const customersWithStats = useMemo(() => {
    return customerList.map(customer => {
      const customerSales = (sales || []).filter((s: any) => s.customerId === customer.id && s.status === "completed")
      const computedTotalSpent = customerSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      const computedTotalTransactions = customerSales.length
      const computedAvgOrderValue = computedTotalTransactions > 0 ? computedTotalSpent / computedTotalTransactions : 0
      
      const customerEmptyCases = (emptyCaseTransactions || []).filter((t: any) => t.customerId === customer.id)
      const computedPendingReturns = customerEmptyCases.reduce((sum: number, t: any) => sum + (t.pendingQuantity || 0), 0)
      const computedDepositValue = customerEmptyCases.reduce((sum: number, t: any) => sum + (t.totalDepositValue || 0), 0)
      
      return {
        ...customer,
        computedTotalSpent,
        computedTotalTransactions,
        computedAvgOrderValue,
        computedPendingReturns,
        computedDepositValue,
      }
    })
  }, [customerList, sales, emptyCaseTransactions])

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customersWithStats

    if (query) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(c => c.type === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "spent":
          return (b.computedTotalSpent || 0) - (a.computedTotalSpent || 0)
        case "transactions":
          return (b.computedTotalTransactions || 0) - (a.computedTotalTransactions || 0)
        case "pending":
          return (b.computedPendingReturns || 0) - (a.computedPendingReturns || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [customersWithStats, query, typeFilter, sortBy])

  // Statistics
  const stats = useMemo(() => {
    const totalCustomers = customerList.length
    const totalSpent = customersWithStats.reduce((sum, c) => sum + (c.computedTotalSpent || 0), 0)
    const avgSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0
    const totalPendingReturns = customersWithStats.reduce((sum, c) => sum + (c.computedPendingReturns || 0), 0)
    const totalDepositValue = customersWithStats.reduce((sum, c) => sum + (c.computedDepositValue || 0), 0)
    
    const byType: Record<string, number> = {}
    customerList.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1
    })

    return {
      totalCustomers,
      totalSpent,
      avgSpent,
      totalPendingReturns,
      totalDepositValue,
      byType,
    }
  }, [customerList, customersWithStats])

  // Add customer
  const handleAddCustomer = (data: any) => {
    const newCustomer: UICustomer = {
      id: `cust_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      address: data.address || "",
      city: data.city || "",
      type: data.type,
      totalSpent: 0,
      totalTransactions: 0,
      pendingEmpties: 0,
      totalPurchases: 0,
      refundableDeposits: 0,
      unpaidBalance: 0,
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    setCustomerList([newCustomer, ...customerList])
    setAddOpen(false)
    toast.success(`Customer ${newCustomer.name} added`)
  }

  // Update customer
  const handleUpdateCustomer = (data: any) => {
    if (!editingCustomer) return
    
    const updatedCustomer: UICustomer = {
      ...editingCustomer,
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      address: data.address || "",
      city: data.city || "",
      type: data.type,
      notes: data.notes || "",
      updatedAt: new Date().toISOString(),
    }
    
    setCustomerList(customerList.map(c => c.id === editingCustomer.id ? updatedCustomer : c))
    setEditingCustomer(null)
    toast.success("Customer updated")
  }

  // Delete customer
  const handleDeleteCustomer = () => {
    if (!deletingCustomer) return
    
    setCustomerList(customerList.filter(c => c.id !== deletingCustomer.id))
    setDeletingCustomer(null)
    toast.success("Customer removed")
  }

  // Export CSV
  const handleExport = () => {
    const data = filteredCustomers.map(c => ({
      "Name": c.name,
      "Phone": c.phone,
      "Email": c.email,
      "Type": c.type,
      "Total Spent": formatCurrency(c.computedTotalSpent || 0),
      "Transactions": c.computedTotalTransactions || 0,
      "Avg Order": formatCurrency(c.computedAvgOrderValue || 0),
      "Pending Returns": c.computedPendingReturns || 0,
      "Deposit Value": formatCurrency(c.computedDepositValue || 0),
      "Address": c.address || "",
      "City": c.city || "",
      "Customer Since": formatDate(c.createdAt),
    }))

    if (data.length === 0) {
      toast.error("No data to export")
      return
    }

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
    toast.success("Customers exported")
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      retail: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      wholesale: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      distributor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      bar: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      hotel: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    }
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>
  }

  return (
    <>
      <DashboardHeader 
        title="Customer Management" 
        description="Manage customer information, track purchases, and monitor empty case returns"
      />

      <div className="flex justify-end gap-2 px-4 md:px-6 pt-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <Users className="size-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <DollarSign className="size-6 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Spent</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.avgSpent)}</p>
              </div>
              <TrendingUp className="size-6 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPendingReturns}</p>
              </div>
              <Package className="size-6 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deposit Value</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalDepositValue)}</p>
              </div>
              <Wallet className="size-6 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="bar">Bar/Restaurant</SelectItem>
                <SelectItem value="hotel">Hotel/Lodge</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="spent">Sort by Total Spent</SelectItem>
                <SelectItem value="transactions">Sort by Transactions</SelectItem>
                <SelectItem value="pending">Sort by Pending Returns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Avg Order</TableHead>
                  <TableHead className="text-right">Pending Returns</TableHead>
                  <TableHead>Customer Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {customer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.city && (
                            <p className="text-xs text-muted-foreground">{customer.city}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {customer.phone && (
                          <span className="text-sm">{customer.phone}</span>
                        )}
                        {customer.email && (
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(customer.type)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(customer.computedTotalSpent || 0)}
                    </TableCell>
                    <TableCell className="text-right">{customer.computedTotalTransactions || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.computedAvgOrderValue || 0)}</TableCell>
                    <TableCell className="text-right">
                      {(customer.computedPendingReturns || 0) > 0 ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {customer.computedPendingReturns} cases
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(customer.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setViewingCustomer(customer)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeletingCustomer(customer)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <Users className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No customers found</p>
                      <Button 
                        variant="link" 
                        onClick={() => setAddOpen(true)}
                        className="mt-2"
                      >
                        Add your first customer
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details below</DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onSubmit={handleAddCustomer}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(o) => !o && setEditingCustomer(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm 
              initial={editingCustomer}
              onSubmit={handleUpdateCustomer}
              onCancel={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <CustomerDetailsModal 
        customer={viewingCustomer} 
        onClose={() => setViewingCustomer(null)} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(o) => !o && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingCustomer?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}