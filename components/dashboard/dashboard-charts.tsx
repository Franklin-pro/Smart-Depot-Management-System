"use client"

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

const salesData = [
  { day: "Mon", sales: 420000, expenses: 180000 },
  { day: "Tue", sales: 510000, expenses: 120000 },
  { day: "Wed", sales: 380000, expenses: 200000 },
  { day: "Thu", sales: 620000, expenses: 150000 },
  { day: "Fri", sales: 790000, expenses: 220000 },
  { day: "Sat", sales: 980000, expenses: 260000 },
  { day: "Sun", sales: 540000, expenses: 140000 },
]

const brandData = [
  { brand: "Primus", cases: 320 },
  { brand: "Skol", cases: 240 },
  { brand: "Mutzig", cases: 180 },
  { brand: "Heineken", cases: 95 },
  { brand: "Guinness", cases: 60 },
  { brand: "Amstel", cases: 20 },
]

const paymentData = [
  { method: "Cash", value: 45, fill: "var(--color-cash)" },
  { method: "Mobile", value: 30, fill: "var(--color-mobile)" },
  { method: "Card", value: 15, fill: "var(--color-card)" },
  { method: "Bank", value: 10, fill: "var(--color-bank)" },
]

const salesConfig: ChartConfig = {
  sales: { label: "Sales", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
}
const brandConfig: ChartConfig = { cases: { label: "Cases", color: "var(--chart-1)" } }
const paymentConfig: ChartConfig = {
  cash: { label: "Cash", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
  card: { label: "Card", color: "var(--chart-3)" },
  bank: { label: "Bank", color: "var(--chart-5)" },
}

const compact = (n: number) => `${(n / 1000).toFixed(0)}k`

export function SalesTrendChart() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Sales vs Expenses</CardTitle>
        <CardDescription>Last 7 days performance (RWF)</CardDescription>
      </CardHeader>
      <CardContent>
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
            <ChartTooltip content={<ChartTooltipContent />} />
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
      </CardContent>
    </Card>
  )
}

export function BrandStockChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by Brand</CardTitle>
        <CardDescription>Full cases available</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}

export function PaymentMethodChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Share of transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={paymentConfig} className="mx-auto aspect-square h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={paymentData} dataKey="value" nameKey="method" innerRadius={55} strokeWidth={4}>
              {paymentData.map((entry) => (
                <Cell key={entry.method} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {paymentData.map((p) => (
            <div key={p.method} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: p.fill }} />
              <span className="text-muted-foreground">{p.method}</span>
              <span className="ml-auto font-medium">{p.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
