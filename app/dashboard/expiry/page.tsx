"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Calendar, AlertTriangle, CheckCircle, Package, Search, 
  Filter, TrendingUp, Clock, XCircle, ArrowLeft, 
  Download, FileText, Bell, AlertCircle, Eye, RefreshCw,
  ChevronLeft, ChevronRight, BarChart3, PieChart,
  DollarSign
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate, getStockStatus, daysUntil } from "@/lib/format"
import type { Product, StockStatus } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

interface ExpiryAlert {
  id: string
  productId: string
  productName: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  status: "critical" | "warning" | "info"
  notified: boolean
}

export default function ExpiryPage() {
  const { products, updateProduct } = useApp()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all")
  const [expiryFilter, setExpiryFilter] = useState<"all" | "expired" | "30days" | "60days" | "90days">("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([])

  // Generate expiry alerts
  useEffect(() => {
    const newAlerts: ExpiryAlert[] = []
    products.forEach(product => {
      const daysLeft = daysUntil(product.expiryDate)
      
      if (daysLeft <= 30 && daysLeft > 0) {
        newAlerts.push({
          id: `alert-${product.id}`,
          productId: product.id,
          productName: product.name,
          batchNumber: product.batchNumber,
          expiryDate: product.expiryDate,
          daysUntilExpiry: daysLeft,
          status: daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "warning" : "info",
          notified: false,
        })
      }
    })
    setAlerts(newAlerts)
  }, [products])

  // Filter products based on expiry
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const daysLeft = daysUntil(product.expiryDate)
      
      // Search filter
      const matchQuery = product.name.toLowerCase().includes(query.toLowerCase()) ||
                        product.brand.toLowerCase().includes(query.toLowerCase()) ||
                        product.batchNumber.toLowerCase().includes(query.toLowerCase())
      
      // Status filter
      const matchStatus = statusFilter === "all" || getStockStatus(product) === statusFilter
      
      // Expiry filter
      let matchExpiry = true
      switch (expiryFilter) {
        case "expired":
          matchExpiry = daysLeft < 0
          break
        case "30days":
          matchExpiry = daysLeft >= 0 && daysLeft <= 30
          break
        case "60days":
          matchExpiry = daysLeft >= 0 && daysLeft <= 60
          break
        case "90days":
          matchExpiry = daysLeft >= 0 && daysLeft <= 90
          break
        default:
          matchExpiry = true
      }
      
      return matchQuery && matchStatus && matchExpiry
    }).sort((a, b) => {
      const daysA = daysUntil(a.expiryDate)
      const daysB = daysUntil(b.expiryDate)
      return daysA - daysB
    })
  }, [products, query, statusFilter, expiryFilter])

  // Statistics
  const stats = useMemo(() => {
    const totalProducts = products.length
    const expired = products.filter(p => daysUntil(p.expiryDate) < 0).length
    const expiringSoon = products.filter(p => {
      const days = daysUntil(p.expiryDate)
      return days >= 0 && days <= 30
    }).length
    const critical = products.filter(p => {
      const days = daysUntil(p.expiryDate)
      return days >= 0 && days <= 7
    }).length
    const warning = products.filter(p => {
      const days = daysUntil(p.expiryDate)
      return days > 7 && days <= 14
    }).length
    const healthy = products.filter(p => daysUntil(p.expiryDate) > 30).length
    
    // Value at risk
    const valueAtRisk = products.reduce((sum, p) => {
      const days = daysUntil(p.expiryDate)
      if (days >= 0 && days <= 30) {
        return sum + (p.sellingPrice * p.fullCases)
      }
      return sum
    }, 0)
    
    return {
      totalProducts,
      expired,
      expiringSoon,
      critical,
      warning,
      healthy,
      valueAtRisk,
      expiryRate: totalProducts > 0 ? (expired / totalProducts) * 100 : 0,
    }
  }, [products])

  // Chart data
  const expiryDistribution = useMemo(() => {
    const ranges = [
      { name: "Expired", value: products.filter(p => daysUntil(p.expiryDate) < 0).length, color: "#ef4444" },
      { name: "0-7 days", value: products.filter(p => {
        const days = daysUntil(p.expiryDate)
        return days >= 0 && days <= 7
      }).length, color: "#f97316" },
      { name: "8-14 days", value: products.filter(p => {
        const days = daysUntil(p.expiryDate)
        return days > 7 && days <= 14
      }).length, color: "#f59e0b" },
      { name: "15-30 days", value: products.filter(p => {
        const days = daysUntil(p.expiryDate)
        return days > 14 && days <= 30
      }).length, color: "#eab308" },
      { name: "31-60 days", value: products.filter(p => {
        const days = daysUntil(p.expiryDate)
        return days > 30 && days <= 60
      }).length, color: "#84cc16" },
      { name: "60+ days", value: products.filter(p => daysUntil(p.expiryDate) > 60).length, color: "#10b981" },
    ]
    return ranges.filter(r => r.value > 0)
  }, [products])

  const expiryTimeline = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date()
    const data = []
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthName = months[month.getMonth()]
      
      const expiringInMonth = products.filter(p => {
        const expiry = new Date(p.expiryDate)
        return expiry.getMonth() === month.getMonth() && 
               expiry.getFullYear() === month.getFullYear() &&
               daysUntil(p.expiryDate) >= 0
      }).length
      
      data.push({
        month: monthName,
        expiring: expiringInMonth,
      })
    }
    
    return data
  }, [products])

  // Handle extend expiry date
  const handleExtendExpiry = () => {
    if (!selectedProduct || !newExpiryDate) return
    
    const updatedProduct = {
      ...selectedProduct,
      expiryDate: new Date(newExpiryDate).toISOString(),
    }
    updateProduct(selectedProduct.id, updatedProduct)
    
    setExtendDialogOpen(false)
    setSelectedProduct(null)
    setNewExpiryDate("")
    toast.success(`Expiry date extended for ${selectedProduct.name}`)
  }

  // Handle mark as expired (for reporting)
  const handleMarkAsExpired = (product: Product) => {
    // This could trigger a write-off or disposal process
    toast.warning(`${product.name} marked as expired and will be removed from active inventory`)
  }

  // Export data
  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      "Product Name": p.name,
      "Brand": p.brand,
      "Batch Number": p.batchNumber,
      "Category": p.category,
      "Full Cases": p.fullCases,
      "Empty Cases": p.emptyCases,
      "Selling Price": formatCurrency(p.sellingPrice),
      "Expiry Date": formatDate(p.expiryDate),
      "Days Until Expiry": daysUntil(p.expiryDate),
      "Status": getStockStatus(p),
    }))

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expiry-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report exported successfully")
  }

  // Get expiry badge
  const getExpiryBadge = (expiryDate: string) => {
    const days = daysUntil(expiryDate)
    
    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expired</Badge>
    }
    if (days <= 7) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse">Critical ({days}d)</Badge>
    }
    if (days <= 14) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Warning ({days}d)</Badge>
    }
    if (days <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Expiring Soon ({days}d)</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Good ({days}d)</Badge>
  }

  // Critical alerts count
  const criticalAlerts = alerts.filter(a => a.status === "critical").length

  return (
    <>
      <DashboardHeader
        title="Expiry Management" 
        description="Track product expiration dates and manage expiring inventory"
      />

      {/* Action Buttons - Moved outside DashboardHeader */}
      <div className="flex justify-end gap-2 px-4 md:px-6 pt-2">
        {criticalAlerts > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3" />
            {criticalAlerts} Critical Alerts
          </Badge>
        )}
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Alert Banner for Critical Expiry */}
        {criticalAlerts > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Expiry Alerts</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {criticalAlerts} product(s) will expire within 7 days. Take action immediately!
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-300 hover:bg-red-100 dark:border-red-700"
                onClick={() => setActiveTab("overview")}
              >
                <Eye className="size-4 mr-2" />
                View Details
              </Button>
            </div>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="size-6 text-blue-500 dark:text-blue-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expired}</p>
              </div>
              <XCircle className="size-6 text-red-500 dark:text-red-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.expiringSoon}</p>
              </div>
              <Clock className="size-6 text-yellow-500 dark:text-yellow-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical (0-7d)</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.critical}</p>
              </div>
              <AlertCircle className="size-6 text-orange-500 dark:text-orange-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Value at Risk</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.valueAtRisk)}
                </p>
              </div>
              <TrendingUp className="size-6 text-purple-500 dark:text-purple-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiry Rate</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {stats.expiryRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="size-6 text-rose-500 dark:text-rose-400" />
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
            <TabsTrigger value="actions">Actions Required</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Product List */}
          <TabsContent value="overview" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: StockStatus | "all") => setStatusFilter(v)}>
                  <SelectTrigger className="sm:w-44">
                    <SelectValue placeholder="Stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={expiryFilter} onValueChange={(v: any) => setExpiryFilter(v)}>
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="Expiry timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="expired">Expired Only</SelectItem>
                    <SelectItem value="30days">Expiring in 30 days</SelectItem>
                    <SelectItem value="60days">Expiring in 60 days</SelectItem>
                    <SelectItem value="90days">Expiring in 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Table */}
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const daysLeft = daysUntil(product.expiryDate)
                      const isExpiring = daysLeft >= 0 && daysLeft <= 30
                      const isExpired = daysLeft < 0
                      
                      return (
                        <TableRow 
                          key={product.id}
                          className={
                            isExpired ? "bg-red-50/50 dark:bg-red-950/20" :
                            isExpiring && daysLeft <= 7 ? "bg-orange-50/50 dark:bg-orange-950/20" :
                            isExpiring ? "bg-yellow-50/50 dark:bg-yellow-950/20" :
                            ""
                          }
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {product.brand} · {product.batchNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{product.category}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span className="font-medium">{product.fullCases} cases</span>
                              <span className="text-xs text-muted-foreground">
                                {product.emptyCases} empty
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(product.expiryDate)}</TableCell>
                          <TableCell>
                            {getExpiryBadge(product.expiryDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!isExpired && daysLeft <= 30 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProduct(product)
                                          setExtendDialogOpen(true)
                                        }}
                                      >
                                        <Calendar className="size-4 mr-1" />
                                        Extend
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Extend expiry date</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {isExpired && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleMarkAsExpired(product)}
                                      >
                                        <AlertCircle className="size-4 mr-1" />
                                        Write Off
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark as expired and remove from inventory</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Package className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No products match your filters
                          </p>
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
              {/* Expiry Distribution Pie Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="size-5" />
                  Expiry Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expiryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expiryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>

              {/* Monthly Expiry Timeline */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="size-5" />
                  Monthly Expiry Forecast
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expiryTimeline}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="expiring" fill="#f59e0b" name="Products Expiring" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="size-5" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {stats.critical > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <AlertTriangle className="size-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">Immediate Action Required</p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {stats.critical} product(s) will expire within 7 days. Consider:
                        urgent sales, promotions, or redistribution.
                      </p>
                    </div>
                  </div>
                )}
                {stats.warning > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Clock className="size-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-300">Plan Ahead</p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        {stats.warning} product(s) will expire in 8-14 days. Plan
                        promotions or special offers to move inventory.
                      </p>
                    </div>
                  </div>
                )}
                {stats.valueAtRisk > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <DollarSign className="size-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">Financial Impact</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Total value at risk: {formatCurrency(stats.valueAtRisk)}. 
                        Taking action now can help minimize losses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bell className="size-4" />
                  Expiry Notifications
                </h3>
              </div>
              <div className="divide-y">
                {alerts.length === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="mx-auto size-8 text-green-500" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No active expiry alerts. All products have sufficient shelf life.
                    </p>
                  </div>
                )}
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      {alert.status === "critical" && (
                        <AlertCircle className="size-5 text-red-500 mt-0.5" />
                      )}
                      {alert.status === "warning" && (
                        <Clock className="size-5 text-orange-500 mt-0.5" />
                      )}
                      {alert.status === "info" && (
                        <Calendar className="size-5 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{alert.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch: {alert.batchNumber} | Expires: {formatDate(alert.expiryDate)}
                        </p>
                        <p className="text-sm mt-1">
                          {alert.status === "critical" && (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              CRITICAL: {alert.daysUntilExpiry} days remaining!
                            </span>
                          )}
                          {alert.status === "warning" && (
                            <span className="text-orange-600 dark:text-orange-400">
                              Warning: {alert.daysUntilExpiry} days remaining
                            </span>
                          )}
                          {alert.status === "info" && (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {alert.daysUntilExpiry} days until expiry
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const product = products.find(p => p.id === alert.productId)
                        if (product) {
                          setSelectedProduct(product)
                          setExtendDialogOpen(true)
                        }
                      }}
                    >
                      Take Action
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Actions Required Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="size-4" />
                  Suggested Promotions
                </h3>
                <div className="space-y-2">
                  {products.filter(p => {
                    const days = daysUntil(p.expiryDate)
                    return days >= 0 && days <= 14
                  }).slice(0, 5).map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires in {daysUntil(product.expiryDate)} days
                        </p>
                      </div>
                      <Badge variant="outline">Suggested: 20% off</Badge>
                    </div>
                  ))}
                  {products.filter(p => daysUntil(p.expiryDate) >= 0 && daysUntil(p.expiryDate) <= 14).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No products requiring promotions
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="size-4" />
                  Bulk Disposal Required
                </h3>
                <div className="space-y-2">
                  {products.filter(p => daysUntil(p.expiryDate) < 0).slice(0, 5).map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Expired {Math.abs(daysUntil(product.expiryDate))} days ago
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleMarkAsExpired(product)}>
                        Write Off
                      </Button>
                    </div>
                  ))}
                  {products.filter(p => daysUntil(p.expiryDate) < 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No expired products to dispose
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Extend Expiry Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Expiry Date</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Current expiry: {selectedProduct && formatDate(selectedProduct.expiryDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Expiry Date</Label>
              <Input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendExpiry}>
                <Calendar className="size-4 mr-2" />
                Extend Expiry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}