"use client"

import { useApp } from "@/lib/store"
import { useMetrics } from "@/lib/use-metrics"
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
} from "lucide-react"

export default function DashboardPage() {
  const { currentUser } = useApp()
  const m = useMetrics()
  const firstName = currentUser?.name.split(" ")[0]

  return (
    <>
      <DashboardHeader title="Dashboard" description="Real-time overview of your depot" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Welcome back, {firstName}</h2>
          <p className="text-sm text-muted-foreground">Here is what&apos;s happening across your depot today.</p>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Full Cases"
            value={formatNumber(m.totalFullCases)}
            icon={Package}
            tone="primary"
            trend={{ value: "8.2%", up: true }}
            hint="vs last week"
          />
          <StatCard
            label="Empty Cases"
            value={formatNumber(m.totalEmptyCases)}
            icon={PackageOpen}
            tone="info"
            hint={`${m.missingEmpties} missing`}
          />
          <StatCard
            label="Daily Sales"
            value={formatCurrency(m.dailySales)}
            icon={TrendingUp}
            tone="success"
            trend={{ value: "12.5%", up: true }}
            hint="today"
          />
          <StatCard
            label="Net Profit"
            value={formatCurrency(m.netProfit)}
            icon={CircleDollarSign}
            tone={m.netProfit >= 0 ? "success" : "danger"}
            trend={{ value: "4.1%", up: m.netProfit >= 0 }}
            hint="this period"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Stock Value" value={formatCurrency(m.stockValue)} icon={Boxes} tone="neutral" />
          <StatCard label="Monthly Revenue" value={formatCurrency(m.monthlyRevenue)} icon={TrendingUp} tone="primary" />
          <StatCard label="Total Expenses" value={formatCurrency(m.totalExpenses)} icon={Wallet} tone="danger" />
          <StatCard
            label="Expiring Soon"
            value={`${m.expiringSoon.length} products`}
            icon={CalendarClock}
            tone="primary"
            hint={`${m.expired.length} expired`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SalesTrendChart />
          <BrandStockChart />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PaymentMethodChart />
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
        </div>

        {/* Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Expiry Alerts</CardTitle>
              <Badge variant="secondary">{m.expiringSoon.length + m.expired.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...m.expired, ...m.expiringSoon].slice(0, 5).map((p) => {
                const d = daysUntil(p.expiryDate)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={d < 0 ? "size-4 text-destructive" : "size-4 text-primary"}
                      />
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.fullCases} cases</span>
                    </div>
                    <Badge variant={d < 0 ? "destructive" : "secondary"}>
                      {d < 0 ? "Expired" : `${d} days left`}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              <Badge variant="secondary">{m.lowStock.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {m.lowStock.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">All products are well stocked.</p>
              )}
              {m.lowStock.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <Badge variant="outline">{p.fullCases} / {p.lowStockThreshold} cases</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
