"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Sale, Product, Expense } from "@/lib/types"

// Compact number formatter: 1_500 -> 1.5K, 2_000_000 -> 2M, 3_000_000_000 -> 3B
const compact = (n: number) => {
  const abs = Math.abs(n)
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "")
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`
  if (abs >= 1_000) return `${trim(n / 1_000)}K`
  return `${n}`
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

// Friendly labels for whatever payment-method key the API returns
const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile: "Mobile Money",
  mobile_money: "Mobile Money",
  card: "Card",
  bank: "Bank",
  bank_transfer: "Bank",
  credit: "Credit",
  check: "Cheque",
  cheque: "Cheque",
}

function labelFor(method: string) {
  if (!method) return "Unknown"
  return PAYMENT_LABELS[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1)
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
    {message}
  </div>
)

// ---------------------------------------------------------------------------
// Sales vs Expenses — last 7 days from real sales & expenses
// ---------------------------------------------------------------------------
const salesConfig: ChartConfig = {
  sales: { label: "Sales", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
}

type TrendPeriod = "monthly" | "yearly"

export function SalesTrendChart({
  sales = [],
  expenses = [],
}: {
  sales?: Sale[]
  expenses?: Expense[]
}) {
  const [period, setPeriod] = useState<TrendPeriod>("monthly")

  const salesData = useMemo(() => {
    const buckets: { key: string; day: string; sales: number; expenses: number }[] = []
    const byKey = new Map<string, { sales: number; expenses: number }>()

    const now = new Date()

    if (period === "monthly") {
      // Last 12 months (oldest -> newest)
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        byKey.set(key, { sales: 0, expenses: 0 })
        buckets.push({
          key,
          day: d.toLocaleDateString("en-US", { month: "short" }),
          sales: 0,
          expenses: 0,
        })
      }
    } else {
      // Last 5 years (oldest -> newest)
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i
        const key = String(year)
        byKey.set(key, { sales: 0, expenses: 0 })
        buckets.push({ key, day: key, sales: 0, expenses: 0 })
      }
    }

    const keyOf = (iso: string) => {
      const d = new Date(iso)
      return period === "monthly"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : String(d.getFullYear())
    }

    for (const s of sales) {
      const bucket = byKey.get(keyOf(s.createdAt))
      if (bucket) bucket.sales += s.total || 0
    }
    for (const e of expenses) {
      const bucket = byKey.get(keyOf(e.date))
      if (bucket) bucket.expenses += e.amount || 0
    }

    return buckets.map((b) => ({ ...b, ...byKey.get(b.key)! }))
  }, [sales, expenses, period])

  const hasData = salesData.some((d) => d.sales > 0 || d.expenses > 0)

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Sales vs Expenses</CardTitle>
          <CardDescription>
            {period === "monthly" ? "Last 12 months (RWF)" : "Last 5 years (RWF)"}
          </CardDescription>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["monthly", "yearly"] as TrendPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            message={`No sales or expenses recorded in the last ${
              period === "monthly" ? "12 months" : "5 years"
            }.`}
          />
        ) : (
          <ChartContainer config={salesConfig} className="h-[280px] w-full">
            <AreaChart data={salesData} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={compact} width={40} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ background: item.color || (item.payload as any)?.fill }}
                        />
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="capitalize text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            RWF {compact(Number(value))}
                          </span>
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="sales"
                type="monotone"
                fill="url(#fillSales)"
                stroke="var(--color-sales)"
                strokeWidth={2}
              />
              <Area
                dataKey="expenses"
                type="monotone"
                fill="url(#fillExpenses)"
                stroke="var(--color-expenses)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Stock by Brand — real full-case totals grouped by product brand
// ---------------------------------------------------------------------------
const brandConfig: ChartConfig = { cases: { label: "Cases", color: "var(--chart-1)" } }

export function BrandStockChart({ products = [] }: { products?: Product[] }) {
  const brandData = useMemo(() => {
    const byBrand = new Map<string, number>()
    for (const p of products) {
      const brand = p.brand || "Unknown"
      byBrand.set(brand, (byBrand.get(brand) || 0) + (p.fullCases || 0))
    }
    return Array.from(byBrand, ([brand, cases]) => ({ brand, cases }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 8)
  }, [products])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by Brand</CardTitle>
        <CardDescription>Full cases available</CardDescription>
      </CardHeader>
      <CardContent>
        {brandData.length === 0 ? (
          <EmptyState message="No products in inventory yet." />
        ) : (
          <ChartContainer config={brandConfig} className="h-[280px] w-full">
            <BarChart data={brandData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} hide />
              <YAxis
                dataKey="brand"
                type="category"
                tickLine={false}
                axisLine={false}
                width={70}
                tickMargin={4}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="cases" fill="var(--color-cases)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Payment Methods — real share of sales grouped by paymentMethod
// ---------------------------------------------------------------------------
export function PaymentMethodChart({ sales = [] }: { sales?: Sale[] }) {
  const { paymentData, paymentConfig, totalRevenue } = useMemo(() => {
    // Aggregate transaction count and revenue per payment method
    const byMethod = new Map<string, { count: number; amount: number }>()
    for (const s of sales) {
      const method = (s.paymentMethod || s.payment || "unknown") as string
      const key = String(method).toLowerCase()
      const entry = byMethod.get(key) || { count: 0, amount: 0 }
      entry.count += 1
      entry.amount += s.total || 0
      byMethod.set(key, entry)
    }

    const total = sales.length
    const revenue = Array.from(byMethod.values()).reduce((sum, e) => sum + e.amount, 0)

    const data = Array.from(byMethod, ([method, e], i) => ({
      key: method,
      method: labelFor(method),
      value: e.count,
      amount: e.amount,
      percent: total > 0 ? Math.round((e.count / total) * 100) : 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })).sort((a, b) => b.value - a.value)

    const config: ChartConfig = {}
    for (const d of data) {
      config[d.key] = { label: d.method, color: d.fill }
    }

    return { paymentData: data, paymentConfig: config, totalRevenue: revenue }
  }, [sales])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Share of sales transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentData.length === 0 ? (
          <EmptyState message="No sales recorded yet." />
        ) : (
          <>
            <ChartContainer config={paymentConfig} className="mx-auto aspect-square h-[240px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={paymentData} dataKey="value" nameKey="method" innerRadius={55} strokeWidth={4}>
                  {paymentData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {paymentData.map((p) => (
                <div key={p.key} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: p.fill }} />
                  <span className="text-muted-foreground">{p.method}</span>
                  <span className="ml-auto font-medium">{p.percent}%</span>
                </div>
              ))}
            </div>
            {totalRevenue > 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {sales.length} transaction{sales.length === 1 ? "" : "s"} across {paymentData.length}{" "}
                method{paymentData.length === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
