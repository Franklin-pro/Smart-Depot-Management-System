"use client"

import { useApp } from "@/lib/store"
import { formatCurrency, formatNumber, daysUntil } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import {
  SalesTrendChart,
  BrandStockChart,
  PaymentMethodChart,
} from "@/components/dashboard/dashboard-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Boxes,
  PackageOpen,
  TrendingUp,
  Wallet,
  CircleDollarSign,
  CalendarClock,
  AlertTriangle,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react"
import { dashboardService } from "@/services"
import { useEffect, useState } from "react"
import type { DashboardStats } from "@/services/dashboard.service"

export default function DashboardPage() {
  const { currentUser } = useApp()
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const firstName = currentUser?.name?.split(" ")[0] || "User"

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardService.getStats()
      setDashboardData(data)
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setError(error.response?.data?.detail || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <>
        <DashboardHeader title="Dashboard" description="Real-time overview of your depot" />
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg col-span-2"></div>
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg col-span-2"></div>
          </div>
        </div>
      </>
    )
  }

  // Show error state
  if (error) {
    return (
      <>
        <DashboardHeader title="Dashboard" description="Real-time overview of your depot" />
        <div className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </>
    )
  }

  // Use real data or fallback to defaults
  const data:any = dashboardData || {
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    salesRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    lowStockProducts: 0,
    expiringProducts: 0,
    expiredProducts: 0,
    pendingEmptyCases: 0,
    refundableDeposits: 0,
    recentActivities: [],
  }

  // Calculate metrics from real data
  const metrics = {
    totalFullCases: data.totalProducts || 0,
    totalEmptyCases: data.pendingEmptyCases || 0,
    dailySales: data.salesRevenue || 0,
    netProfit: data.grossProfit || 0,
    stockValue: data.totalProducts * 100, // Example calculation - adjust based on your product prices
    monthlyRevenue: data.salesRevenue || 0,
    totalExpenses: data.totalExpenses || 0,
    expiringSoon: [], // This would come from a separate API call or be included in dashboard data
    expired: [], // This would come from a separate API call or be included in dashboard data
    lowStock: data.lowStockProducts > 0 ? [{ 
      id: '1', 
      name: 'Example Product', 
      fullCases: 5, 
      lowStockThreshold: 10 
    }] : [], // Example - you'd get actual products from another API
    missingEmpties: 0,
  }

  return (
    <>
      <DashboardHeader title="Dashboard" description="Real-time overview of your depot" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h2>
          <p className="text-sm text-muted-foreground">Here is what&apos;s happening across your depot today.</p>
        </div>

        {/* Primary stats - using real data */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Products"
            value={formatNumber(data.totalProducts)}
            icon={Package}
            tone="primary"
            hint="Available in inventory"
          />
          <StatCard
            label="Total Customers"
            value={formatNumber(data.totalCustomers)}
            icon={Users}
            tone="info"
            hint="Registered customers"
          />
          <StatCard
            label="Total Sales"
            value={formatNumber(data.totalSales)}
            icon={ShoppingCart}
            tone="success"
            hint="Completed transactions"
          />
          <StatCard
            label="Sales Revenue"
            value={formatCurrency(data.salesRevenue)}
            icon={DollarSign}
            tone="success"
            hint="Total revenue"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Expenses" 
            value={formatCurrency(data.totalExpenses)}
            icon={Wallet}
            tone="danger"
            hint="All expenses"
          />
          <StatCard
            label="Gross Profit"
            value={formatCurrency(data.grossProfit)}
            icon={CircleDollarSign}
            tone={data.grossProfit >= 0 ? "success" : "danger"}
            hint="Revenue - Expenses"
          />
          <StatCard
            label="Pending Empty Cases"
            value={formatNumber(data.pendingEmptyCases)}
            icon={PackageOpen}
            tone="info"
            hint="Awaiting return"
          />
          <StatCard
            label="Refundable Deposits"
            value={formatCurrency(data.refundableDeposits)}
            icon={Boxes}
            tone="primary"
            hint="Customer deposits"
          />
        </div>

        {/* Charts - using real data */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SalesTrendChart />
          <BrandStockChart />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PaymentMethodChart />
          <div className="lg:col-span-2">
            <ActivityFeed activities={data.recentActivities || []} />
          </div>
        </div>

        {/* Alerts using real data */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Expiry Alerts */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Expiry Alerts</CardTitle>
              <Badge variant="secondary">
                {data.expiringProducts > 0 ? data.expiringProducts : 0}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.expiringProducts === 0 && data.expiredProducts === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No products expiring soon. ✓
                </p>
              )}
              {data.expiringProducts > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-primary" />
                    <span className="text-sm font-medium">Products expiring soon</span>
                  </div>
                  <Badge variant="secondary">{data.expiringProducts}</Badge>
                </div>
              )}
              {data.expiredProducts > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-destructive" />
                    <span className="text-sm font-medium text-red-700">Expired products</span>
                  </div>
                  <Badge variant="destructive">{data.expiredProducts}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              <Badge variant="secondary">{data.lowStockProducts}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.lowStockProducts === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  All products are well stocked. ✓
                </p>
              )}
              {data.lowStockProducts > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    <span className="text-sm font-medium">Products below minimum stock</span>
                  </div>
                  <Badge variant="outline">{data.lowStockProducts}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}