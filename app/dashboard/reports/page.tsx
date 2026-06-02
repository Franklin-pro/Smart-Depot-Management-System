"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { 
  FileText, Download, Printer, Calendar, TrendingUp, 
  DollarSign, Package, Users, Truck, AlertCircle, 
  BarChart3, PieChart, LineChart as LineChartIcon,
  ShoppingCart, RefreshCw, Filter, ChevronRight,
  Eye, FileSpreadsheet, FileJson, Receipt, Building,
  Clock, CheckCircle, XCircle, ArrowLeft, Home,
  Sparkles, Zap, Target, Award, Activity, Layers,
  Grid3x3, BarChart4, PieChartIcon, BottleWine, 
  PlusCircle, MinusCircle, RotateCcw, AlertTriangle as AlertTriangleIcon
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate, formatNumber, daysUntil } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  AreaChart,
  Area,
} from "recharts"

// Types
type ReportType = "sales" | "expenses" | "inventory" | "empty-cases" | "profit-loss" | "customers" | "suppliers"
type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom"

interface ReportFilters {
  type: ReportType
  period: Period
  startDate: Date
  endDate: Date
  category?: string
  customerId?: string
  productId?: string
}

interface BottleInfo {
  damaged: number
  missing: number
  returned: number
  notes?: string
}

interface ExtendedProduct {
  id: string
  name: string
  brand: string
  category: string
  fullCases: number
  emptyCases: number
  sellingPrice: number
  purchasePrice: number
  expiryDate: string
  batchNumber: string
  bottleInfo?: BottleInfo
  lastStockCheck?: Date
  depositAmount?: number
}

interface ReportData {
  summary: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalSales: number
    totalTransactions: number
    avgOrderValue: number
    totalEmptyCases: number
    returnedCases: number
    pendingReturns: number
    depositValue: number
    refundedValue: number
    totalBottles: number
    missingBottles: number
    damagedBottles: number
    returnedBottles: number
    stockIntegrity: number
  }
  charts: {
    salesTrend: { date: string; amount: number; count: number }[]
    categoryBreakdown: { name: string; value: number; color: string }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
    topCustomers: { name: string; spent: number; transactions: number }[]
    expenseBreakdown: { name: string; amount: number }[]
    paymentMethods: { name: string; value: number }[]
    stockStatus: { name: string; value: number; color: string }[]
    bottleIssues: { name: string; missing: number; damaged: number; returned: number }[]
  }
  tables: {
    recentTransactions: any[]
    pendingReturns: any[]
    expiringProducts: any[]
    supplierPayments: any[]
    bottleIssuesList: any[]
    lowStockProducts: any[]
  }
}

const BOTTLES_PER_CASE = 24

// Helper functions
const safeCapitalize = (str: string | undefined | null): string => {
  if (!str || typeof str !== 'string') return "Unknown"
  if (str.length === 0) return "Unknown"
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const safeFormatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A"
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return "Invalid Date"
  }
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

// Quick Stats Cards
function QuickStatsCards() {
  const { products, sales = [], expenses = [] } = useApp()
  
  const stats = useMemo(() => {
    const completedSales = (sales || []).filter(s => s.status === "completed")
    const totalRevenue = completedSales.reduce((sum, s) => sum + (s.total || 0), 0)
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalProducts = products.length
    const lowStock = products.filter(p => p.fullCases < (p.lowStockThreshold || 40)).length
    
    // Calculate bottle statistics
    const totalBottles = products.reduce((sum, p) => {
      const extendedP = p as ExtendedProduct
      const totalPossible = (p.fullCases || 0) * BOTTLES_PER_CASE
      const missing = (extendedP.bottleInfo?.missing || 0)
      const damaged = (extendedP.bottleInfo?.damaged || 0)
      return sum + (totalPossible - missing - damaged)
    }, 0)
    
    const missingBottles = products.reduce((sum, p) => {
      const extendedP = p as ExtendedProduct
      return sum + (extendedP.bottleInfo?.missing || 0)
    }, 0)
    
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
      products: totalProducts,
      lowStock,
      totalBottles,
      missingBottles,
    }
  }, [products, sales, expenses])
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 dark:text-green-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(stats.revenue)}</p>
          </div>
          <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
            <DollarSign className="size-5 text-green-700 dark:text-green-300" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-400">Total Bottles</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatNumber(stats.totalBottles)}</p>
          </div>
          <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-lg">
            <BottleWine className="size-5 text-blue-700 dark:text-blue-300" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-700 dark:text-orange-400">Missing Bottles</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">{formatNumber(stats.missingBottles)}</p>
          </div>
          <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
            <AlertTriangleIcon className="size-5 text-orange-700 dark:text-orange-300" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700 dark:text-red-400">Low Stock Items</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-300">{stats.lowStock}</p>
          </div>
          <div className="p-2 bg-red-200 dark:bg-red-800 rounded-lg">
            <Package className="size-5 text-red-700 dark:text-red-300" />
          </div>
        </div>
      </Card>
    </div>
  )
}

// Report Templates
function ReportTemplates({ onSelectTemplate }: { onSelectTemplate: (type: ReportType, period: Period) => void }) {
  const templates = [
    { icon: TrendingUp, label: "Daily Sales", type: "sales" as ReportType, period: "daily" as Period, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { icon: Package, label: "Weekly Inventory", type: "inventory" as ReportType, period: "weekly" as Period, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { icon: DollarSign, label: "Monthly P&L", type: "profit-loss" as ReportType, period: "monthly" as Period, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    { icon: BottleWine, label: "Empty Cases", type: "empty-cases" as ReportType, period: "monthly" as Period, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { icon: AlertTriangleIcon, label: "Bottle Issues", type: "inventory" as ReportType, period: "monthly" as Period, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  ]
  
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template, index) => (
        <button
          key={index}
          onClick={() => onSelectTemplate(template.type, template.period)}
          className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
        >
          <div className={`p-2 rounded-lg ${template.color}`}>
            <template.icon className="size-5" />
          </div>
          <div>
            <p className="font-medium">{template.label}</p>
            <p className="text-xs text-muted-foreground">Quick report generation</p>
          </div>
          <ChevronRight className="size-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { 
    products, 
    customers, 
    sales = [], 
    expenses = [],
    emptyCaseTransactions = [],
    suppliers = []
  } = useApp()

  const [reportType, setReportType] = useState<ReportType>("sales")
  const [period, setPeriod] = useState<Period>("monthly")
  const [customStartDate, setCustomStartDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date
  })
  const [customEndDate, setCustomEndDate] = useState<Date>(() => new Date())
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

  const getDateRange = (): { startDate: Date; endDate: Date; label: string } => {
    const now = new Date()
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate.setHours(23, 59, 59, 999)
        return { startDate, endDate, label: "Today" }
      case "weekly":
        startDate.setDate(now.getDate() - 7)
        return { startDate, endDate, label: "Last 7 Days" }
      case "monthly":
        startDate.setMonth(now.getMonth() - 1)
        return { startDate, endDate, label: "Last 30 Days" }
      case "quarterly":
        startDate.setMonth(now.getMonth() - 3)
        return { startDate, endDate, label: "Last 90 Days" }
      case "yearly":
        startDate.setFullYear(now.getFullYear() - 1)
        return { startDate, endDate, label: "Last 12 Months" }
      case "custom":
        return { startDate: customStartDate, endDate: customEndDate, label: "Custom Range" }
      default:
        return { startDate, endDate, label: "All Time" }
    }
  }

  const handleSelectTemplate = (type: ReportType, period: Period) => {
    setReportType(type)
    setPeriod(period)
    generateReport(type, period as ReportType)
  }

  const generateReport = (type?: ReportType, period?: ReportType) => {
    const finalType = type || reportType
    setGenerating(true)
    
    setTimeout(() => {
      const { startDate, endDate, label } = getDateRange()
      
      const filteredSales = (sales || []).filter(sale => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= startDate && saleDate <= endDate && sale.status === "completed"
      })
      
      const filteredExpenses = (expenses || []).filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate && expenseDate <= endDate
      })
      
      const filteredEmptyCases = (emptyCaseTransactions || []).filter(t => {
        const txnDate = new Date(t.createdAt)
        return txnDate >= startDate && txnDate <= endDate
      })
      
      // Calculate bottle statistics from products
      const extendedProducts = products as ExtendedProduct[]
      const totalPossibleBottles = extendedProducts.reduce((sum, p) => sum + (p.fullCases * BOTTLES_PER_CASE), 0)
      const totalMissingBottles = extendedProducts.reduce((sum, p) => sum + (p.bottleInfo?.missing || 0), 0)
      const totalDamagedBottles = extendedProducts.reduce((sum, p) => sum + (p.bottleInfo?.damaged || 0), 0)
      const totalReturnedBottles = extendedProducts.reduce((sum, p) => sum + (p.bottleInfo?.returned || 0), 0)
      const totalAvailableBottles = totalPossibleBottles - totalMissingBottles - totalDamagedBottles + totalReturnedBottles
      const stockIntegrity = totalPossibleBottles > 0 ? (totalAvailableBottles / totalPossibleBottles) * 100 : 100
      
      // Summary calculations
      const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const netProfit = totalRevenue - totalExpenses
      const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0)
      const totalTransactions = filteredSales.length
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      
      const totalEmptyCases = filteredEmptyCases.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)
      const returnedCases = filteredEmptyCases.reduce((sum, t) => sum + (t.returnedQuantity || 0), 0)
      const pendingReturns = totalEmptyCases - returnedCases
      const depositValue = filteredEmptyCases.reduce((sum, t) => sum + (t.totalDepositValue || 0), 0)
      const refundedValue = filteredEmptyCases.reduce((sum, t) => sum + (t.refundedAmount || 0), 0)
      
      // Stock status breakdown
      const stockStatus = [
        { name: "Available", value: totalAvailableBottles, color: "#10b981" },
        { name: "Missing", value: totalMissingBottles, color: "#ef4444" },
        { name: "Damaged", value: totalDamagedBottles, color: "#f59e0b" },
        { name: "Returned", value: totalReturnedBottles, color: "#3b82f6" },
      ].filter(s => s.value > 0)
      
      // Bottle issues per product
      const bottleIssues = extendedProducts
        .filter(p => (p.bottleInfo?.missing || 0) > 0 || (p.bottleInfo?.damaged || 0) > 0)
        .map(p => ({
          name: p.name,
          missing: p.bottleInfo?.missing || 0,
          damaged: p.bottleInfo?.damaged || 0,
          returned: p.bottleInfo?.returned || 0,
        }))
      
      // Sales trend data
      const salesByDate = new Map<string, { amount: number; count: number }>()
      filteredSales.forEach(sale => {
        const date = new Date(sale.createdAt).toLocaleDateString()
        const existing = salesByDate.get(date) || { amount: 0, count: 0 }
        salesByDate.set(date, {
          amount: existing.amount + (sale.total || 0),
          count: existing.count + 1
        })
      })
      
      const salesTrend = Array.from(salesByDate.entries())
        .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      // Category breakdown
      const categoryMap = new Map<string, number>()
      const productMap = new Map(products.map(p => [p.id, p]))
      
      filteredSales.forEach(sale => {
        (sale.items || []).forEach(item => {
          const product = productMap.get(item.productId)
          if (product && product.category) {
            categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + (item.quantity || 0))
          }
        })
      })
      
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name: safeCapitalize(name),
        value,
        color: COLORS[index % COLORS.length]
      }))
      
      // Top products
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
      filteredSales.forEach(sale => {
        (sale.items || []).forEach(item => {
          const product = productMap.get(item.productId)
          const productName = product?.name || `Product ${item.productId?.slice(-6) || "Unknown"}`
          const existing = productSales.get(item.productId)
          if (existing) {
            existing.quantity += item.quantity || 0
            existing.revenue += item.subtotal || 0
          } else {
            productSales.set(item.productId, {
              name: productName,
              quantity: item.quantity || 0,
              revenue: item.subtotal || 0
            })
          }
        })
      })
      
      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
      
      // Top customers
      const customerSales = new Map<string, { name: string; spent: number; transactions: number }>()
      filteredSales.forEach(sale => {
        const customerId = sale.customerId || "walk-in"
        const existing = customerSales.get(customerId)
        if (existing) {
          existing.spent += sale.total || 0
          existing.transactions += 1
        } else {
          customerSales.set(customerId, {
            name: sale.customerName || "Walk-in Customer",
            spent: sale.total || 0,
            transactions: 1
          })
        }
      })
      
      const topCustomers = Array.from(customerSales.values())
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
      
      // Expense breakdown
      const expenseByCategory = new Map<string, number>()
      filteredExpenses.forEach(expense => {
        const category = expense.category || "other"
        expenseByCategory.set(category, (expenseByCategory.get(category) || 0) + (expense.amount || 0))
      })
      
      const expenseBreakdown = Array.from(expenseByCategory.entries()).map(([name, amount]) => ({
        name: safeCapitalize(name),
        amount
      }))
      
      // Payment methods
      const paymentMethodMap = new Map<string, number>()
      filteredSales.forEach(sale => {
        const method = sale.paymentMethod || "cash"
        paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + (sale.total || 0))
      })
      
      const paymentMethods = Array.from(paymentMethodMap.entries())
        .filter(([name]) => name && typeof name === 'string' && name.length > 0)
        .map(([name, value]) => ({
          name: safeCapitalize(name),
          value
        }))
      
      // Tables data
      const recentTransactions = filteredSales.slice(0, 10).map(sale => ({
        date: safeFormatDate(sale.createdAt),
        invoice: sale.invoiceNumber || "N/A",
        customer: sale.customerName || "Walk-in",
        amount: sale.total || 0,
        status: sale.status || "completed"
      }))
      
      const pendingReturnsList = filteredEmptyCases
        .filter(t => (t.pendingQuantity || 0) > 0)
        .slice(0, 10)
        .map(t => ({
          customer: t.customerName || "Unknown",
          product: t.productName || "Unknown Product",
          total: t.totalQuantity || 0,
          pending: t.pendingQuantity || 0,
          depositValue: (t.pendingQuantity || 0) * (t.depositAmount || 0)
        }))
      
      const expiringProducts = products
        .filter(p => {
          if (!p.expiryDate) return false
          const daysUntilExpiry = daysUntil(p.expiryDate)
          return daysUntilExpiry >= 0 && daysUntilExpiry <= 30
        })
        .slice(0, 10)
        .map(p => ({
          name: p.name || "Unknown",
          batch: p.batchNumber || "N/A",
          expiryDate: safeFormatDate(p.expiryDate),
          stock: p.fullCases || 0,
          daysLeft: daysUntil(p.expiryDate)
        }))
      
      const supplierPayments = filteredExpenses
        .filter(e => e.category === "supplier" && e.supplierName)
        .slice(0, 10)
        .map(e => ({
          supplier: e.supplierName || "Unknown",
          amount: e.amount || 0,
          date: safeFormatDate(e.date),
          invoice: e.invoiceNumber || "-"
        }))
      
      const lowStockProducts = products
        .filter(p => p.fullCases < (p.lowStockThreshold || 40))
        .map(p => ({
          name: p.name,
          currentStock: p.fullCases,
          threshold: p.lowStockThreshold || 40,
          status: p.fullCases === 0 ? "Out of Stock" : "Low Stock"
        }))
      
      const bottleIssuesList = extendedProducts
        .filter(p => (p.bottleInfo?.missing || 0) > 0 || (p.bottleInfo?.damaged || 0) > 0)
        .slice(0, 10)
        .map(p => ({
          product: p.name,
          missing: p.bottleInfo?.missing || 0,
          damaged: p.bottleInfo?.damaged || 0,
          returned: p.bottleInfo?.returned || 0,
          integrity: p.fullCases > 0 ? ((p.fullCases * BOTTLES_PER_CASE - (p.bottleInfo?.missing || 0) - (p.bottleInfo?.damaged || 0)) / (p.fullCases * BOTTLES_PER_CASE) * 100).toFixed(1) : "100",
          lastCheck: p.lastStockCheck ? safeFormatDate(p.lastStockCheck) : "Never"
        }))
      
      setReportData({
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalSales,
          totalTransactions,
          avgOrderValue,
          totalEmptyCases,
          returnedCases,
          pendingReturns,
          depositValue,
          refundedValue,
          totalBottles: totalAvailableBottles,
          missingBottles: totalMissingBottles,
          damagedBottles: totalDamagedBottles,
          returnedBottles: totalReturnedBottles,
          stockIntegrity
        },
        charts: {
          salesTrend,
          categoryBreakdown,
          topProducts,
          topCustomers,
          expenseBreakdown,
          paymentMethods,
          stockStatus,
          bottleIssues
        },
        tables: {
          recentTransactions,
          pendingReturns: pendingReturnsList,
          expiringProducts,
          supplierPayments,
          bottleIssuesList,
          lowStockProducts
        }
      })
      
      setGenerating(false)
      toast.success(`Report generated for ${label}`)
    }, 1000)
  }

  const exportCSV = () => {
    if (!reportData) return
    
    const data = reportData.tables.recentTransactions.map(t => ({
      "Date": t.date,
      "Invoice": t.invoice,
      "Customer": t.customer,
      "Amount": formatCurrency(t.amount),
      "Status": t.status
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
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  const exportExcel = () => toast.info("Excel export would download here")
  const exportPDF = () => toast.info("PDF export would download here")
  const printReport = () => window.print()
  
  const { startDate, endDate, label } = getDateRange()

  if (!reportData) {
    return (
      <>
        <DashboardHeader 
          title="Reports & Analytics" 
          description="Generate comprehensive business reports and insights"
        />
        
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <QuickStatsCards />
          
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Generate Report</h2>
                  <p className="text-sm text-muted-foreground">Select report type and period</p>
                </div>
                <Sparkles className="size-8 text-primary/50" />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="expenses">Expenses Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="empty-cases">Empty Cases Report</SelectItem>
                      <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                      <SelectItem value="customers">Customer Report</SelectItem>
                      <SelectItem value="suppliers">Supplier Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {period === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(customStartDate)}
                        onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(customEndDate)}
                        onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button size="lg" onClick={() => generateReport()} disabled={generating}>
                  {generating ? (
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="size-4 mr-2" />
                  )}
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </Card>
          
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Quick Report Templates
            </h2>
            <ReportTemplates onSelectTemplate={handleSelectTemplate} />
          </div>
        </div>
      </>
    )
  }

  return (
    <TooltipProvider>
      <>
        <DashboardHeader 
          title="Reports & Analytics" 
          description="Generate comprehensive business reports and insights"
        />
        
        <div className="flex flex-col gap-6 p-4 md:p-6">
          {/* Report Controls */}
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="expenses">Expenses Report</SelectItem>
                      <SelectItem value="inventory">Inventory Report</SelectItem>
                      <SelectItem value="empty-cases">Empty Cases Report</SelectItem>
                      <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                      <SelectItem value="customers">Customer Report</SelectItem>
                      <SelectItem value="suppliers">Supplier Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {period === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(customStartDate)}
                        onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(customEndDate)}
                        onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReportData(null)}>
                  New Report
                </Button>
                <Button onClick={() => generateReport()} disabled={generating}>
                  <RefreshCw className={`size-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Generating..." : "Refresh"}
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Date Range Indicator */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold capitalize">{reportType} Report</h2>
              <p className="text-muted-foreground">
                {safeFormatDate(startDate)} - {safeFormatDate(endDate)} ({label})
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <FileSpreadsheet className="size-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <FileJson className="size-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <FileText className="size-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={printReport}>
                <Printer className="size-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </div>
                <DollarSign className="size-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</p>
                </div>
                <TrendingUp className="size-8 text-red-500 rotate-180" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${reportData.summary.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {formatCurrency(reportData.summary.netProfit)}
                  </p>
                </div>
                <BarChart3 className="size-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Integrity</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.summary.stockIntegrity.toFixed(1)}%</p>
                </div>
                <Activity className="size-8 text-purple-500" />
              </div>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bottles</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.summary.totalBottles)}</p>
                </div>
                <BottleWine className="size-8 text-orange-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Missing Bottles</p>
                  <p className="text-2xl font-bold text-red-600">{formatNumber(reportData.summary.missingBottles)}</p>
                </div>
                <AlertTriangleIcon className="size-8 text-red-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Damaged Bottles</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatNumber(reportData.summary.damagedBottles)}</p>
                </div>
                <AlertCircle className="size-8 text-yellow-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returned Bottles</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(reportData.summary.returnedBottles)}</p>
                </div>
                <RotateCcw className="size-8 text-green-500" />
              </div>
            </Card>
          </div>
          
          {/* Charts Section */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="trends">Sales Trends</TabsTrigger>
              <TabsTrigger value="stock">Stock Status</TabsTrigger>
              <TabsTrigger value="bottles">Bottle Issues</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="products">Top Products</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.charts.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => 
                        name === "amount" ? formatCurrency(value) : value
                      }
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#10b981" name="Revenue" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" name="Transactions" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            
            <TabsContent value="stock" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Stock Status Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={reportData.charts.stockStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.charts.stockStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatNumber(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            
            <TabsContent value="bottles" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bottle Issues by Product</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.charts.bottleIssues} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="missing" stackId="a" fill="#ef4444" name="Missing" />
                    <Bar dataKey="damaged" stackId="a" fill="#f59e0b" name="Damaged" />
                    <Bar dataKey="returned" stackId="a" fill="#10b981" name="Returned" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={reportData.charts.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.charts.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.charts.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => 
                        name === "quantity" ? `${value} cases` : formatCurrency(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="quantity" fill="#f59e0b" name="Units Sold" />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={reportData.charts.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.charts.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Data Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.tables.recentTransactions.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell className="font-mono text-sm">{tx.invoice}</TableCell>
                        <TableCell>{tx.customer}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">Bottle Issues & Discrepancies</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Missing</TableHead>
                      <TableHead className="text-right">Damaged</TableHead>
                      <TableHead className="text-right">Returned</TableHead>
                      <TableHead className="text-right">Integrity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.tables.bottleIssuesList.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell className="text-right text-red-600">{item.missing}</TableCell>
                        <TableCell className="text-right text-yellow-600">{item.damaged}</TableCell>
                        <TableCell className="text-right text-green-600">{item.returned}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={parseFloat(item.integrity) >= 90 ? "default" : "destructive"}>
                            {item.integrity}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.tables.bottleIssuesList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No bottle issues reported
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">Low Stock Products</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.tables.lowStockProducts.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.currentStock} cases</TableCell>
                        <TableCell className="text-right">{item.threshold} cases</TableCell>
                        <TableCell>
                          <Badge variant={item.currentStock === 0 ? "destructive" : "outline"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.tables.lowStockProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          All products have adequate stock
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold">Expiring Products (30 days)</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.tables.expiringProducts.map((prod, i) => (
                      <TableRow key={i}>
                        <TableCell>{prod.name}</TableCell>
                        <TableCell className="font-mono text-xs">{prod.batch}</TableCell>
                        <TableCell>{prod.expiryDate}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={prod.daysLeft <= 7 ? "destructive" : "outline"}>
                            {prod.daysLeft} days
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </>
    </TooltipProvider>
  )
}