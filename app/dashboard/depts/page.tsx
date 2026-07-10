"use client"

import { useMemo, useState } from "react"
import { useApp } from "@/lib/store"
import type { Sale, SaleItem } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wallet,
  PackageX,
  Search,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Calendar,
  Receipt,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { salesService } from "@/services"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Product debt from suppliers (what you owe suppliers)
type ProductDebt = {
  id: string
  name: string
  brand?: string
  category?: string
  supplier: string
  requested: number
  received: number
  price: number
  paid: number
  youOwe: number
  theyOweCases: number
  theyOweValue: number
}

// Customer debt from sales
type CustomerDebt = {
  id: string
  name: string
  totalSales: number
  totalAmount: number
  totalPaid: number
  totalBalance: number
  sales: Sale[]
  lastSaleDate: string
  paymentStatus: "paid" | "partial" | "unpaid"
}

type Payment = {
  id: string
  saleId: string
  amount: number
  method: string
  receivedBy: string
  note: string
  createdAt: string
}

function computeProductDebt(p: any): ProductDebt {
  const requested = p.supplierSent ?? 0
  const received = p.receivedCases ?? 0
  const price = p.purchasePricePerContainer ?? 0
  const paid =
    p.totalPaid ??
    (p.payments || []).reduce((sum: number, pay: any) => sum + (pay.amount ?? 0), 0)

  const orderValue = requested * price
  const youOwe = Math.max(0, orderValue - paid)
  const theyOweCases = Math.max(0, requested - received)
  const theyOweValue = theyOweCases * price

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    supplier: p.supplier || "Unknown supplier",
    requested,
    received,
    price,
    paid,
    youOwe,
    theyOweCases,
    theyOweValue,
  }
}

function computeCustomerDebts(sales: Sale[]): CustomerDebt[] {
  if (!sales || sales.length === 0) {
    return []
  }

  const customerMap = new Map<string, CustomerDebt>()

  sales.forEach((sale) => {
    const customerKey = String(sale.customerId ?? sale.customerName ?? "walk-in")
    const customerName = sale.customerName || "Walk-in Customer"

    if (!customerMap.has(customerKey)) {
      customerMap.set(customerKey, {
        id: sale.customerId || sale.customerName || "walk-in",
        name: customerName,
        totalSales: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
        sales: [],
        lastSaleDate: sale.createdAt,
        paymentStatus: "paid",
      })
    }

    const customer = customerMap.get(customerKey)!
    customer.totalSales += 1
    customer.totalAmount += sale.total
    customer.totalPaid += sale.amountPaid
    customer.totalBalance += sale.remainingBalance || 0
    customer.sales.push(sale)
    
    if (new Date(sale.createdAt) > new Date(customer.lastSaleDate)) {
      customer.lastSaleDate = sale.createdAt
    }

    if (customer.totalBalance > 0) {
      customer.paymentStatus = customer.totalPaid === 0 ? "unpaid" : "partial"
    } else {
      customer.paymentStatus = "paid"
    }
  })

  const result = Array.from(customerMap.values())
    .sort((a, b) => b.totalBalance - a.totalBalance)

  return result
}

type FilterMode = "all" | "has_balance" | "settled" | "partial" | "unpaid"
type DebtType = "supplier" | "customer"

function Depts() {
  const { products, sales } = useApp()

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<DebtType>("supplier")
  const [paymentHistory, setPaymentHistory] = useState<Record<string, Payment[]>>({})
  const [loadingPayments, setLoadingPayments] = useState<Record<string, boolean>>({})
  const [expandedPayments, setExpandedPayments] = useState<Record<string, boolean>>({})

  // Fetch payment history for a specific sale
  const fetchPaymentHistory = async (saleId: string) => {
    if (paymentHistory[saleId]) {
      // Toggle visibility if already fetched
      setExpandedPayments(prev => ({ ...prev, [saleId]: !prev[saleId] }))
      return
    }
    
    setLoadingPayments(prev => ({ ...prev, [saleId]: true }))
    try {
      const response: any = await salesService.getPayments(String(saleId))
      const payments = response.data || []
      setPaymentHistory(prev => ({
        ...prev,
        [saleId]: payments
      }))
      setExpandedPayments(prev => ({ ...prev, [saleId]: true }))
    } catch (error: any) {
      console.error("Error fetching payments for sale", saleId, error)
    } finally {
      setLoadingPayments(prev => ({ ...prev, [saleId]: false }))
    }
  }

  // Compute supplier debts
  const supplierDebts = useMemo(
    () => (products || []).map(computeProductDebt),
    [products]
  )

  // Compute customer debts from sales
  const customerDebts = useMemo(
    () => computeCustomerDebts(sales || []),
    [sales]
  )

  // Supplier totals
  const supplierTotals = useMemo(() => {
    const youOwe = supplierDebts.reduce((sum, d) => sum + d.youOwe, 0)
    const theyOweValue = supplierDebts.reduce((sum, d) => sum + d.theyOweValue, 0)
    const theyOweCases = supplierDebts.reduce((sum, d) => sum + d.theyOweCases, 0)
    const settledCount = supplierDebts.filter((d) => d.youOwe === 0 && d.theyOweCases === 0).length
    return { youOwe, theyOweValue, theyOweCases, settledCount }
  }, [supplierDebts])

  // Customer totals
  const customerTotals = useMemo(() => {
    const totalOwed = customerDebts.reduce((sum, d) => sum + d.totalBalance, 0)
    const totalPaid = customerDebts.reduce((sum, d) => sum + d.totalPaid, 0)
    const totalAmount = customerDebts.reduce((sum, d) => sum + d.totalAmount, 0)
    const activeCustomers = customerDebts.filter((d) => d.totalBalance > 0).length
    const totalSales = customerDebts.reduce((sum, d) => sum + d.totalSales, 0)
    return { totalOwed, totalPaid, totalAmount, activeCustomers, totalSales }
  }, [customerDebts])

  // Filter supplier debts
  const filteredSupplierDebts = useMemo(() => {
    return supplierDebts.filter((d) => {
      const matchesQuery =
        !query ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.supplier.toLowerCase().includes(query.toLowerCase())

      if (!matchesQuery) return false

      switch (filter) {
        case "has_balance":
          return d.youOwe > 0
        case "settled":
          return d.youOwe === 0 && d.theyOweCases === 0
        case "partial":
          return d.youOwe > 0 && d.theyOweCases > 0
        default:
          return true
      }
    })
  }, [supplierDebts, query, filter])

  // Filter customer debts
  const filteredCustomerDebts = useMemo(() => {
    const filtered = customerDebts.filter((d) => {
      const matchesQuery =
        !query ||
        d.name.toLowerCase().includes(query.toLowerCase())

      if (!matchesQuery) return false

      switch (filter) {
        case "has_balance":
          return d.totalBalance > 0
        case "settled":
          return d.totalBalance === 0
        case "partial":
          return d.totalBalance > 0 && d.paymentStatus === "partial"
        case "unpaid":
          return d.totalBalance > 0 && d.totalPaid === 0
        default:
          return true
      }
    })

    return filtered
  }, [customerDebts, query, filter])

  // Group supplier debts by supplier
  const bySupplier = useMemo(() => {
    const groups: Record<string, ProductDebt[]> = {}
    for (const d of filteredSupplierDebts) {
      if (!groups[d.supplier]) groups[d.supplier] = []
      groups[d.supplier].push(d)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredSupplierDebts])

  const toggleSupplier = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }))

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-700">Paid</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Partial</Badge>
      case "unpaid":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Unpaid</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Define filter options
  const supplierFilterOptions = [
    { key: "all" as FilterMode, label: "All" },
    { key: "has_balance" as FilterMode, label: "You owe" },
    { key: "settled" as FilterMode, label: "Settled" },
  ]

  const customerFilterOptions = [
    { key: "all" as FilterMode, label: "All" },
    { key: "has_balance" as FilterMode, label: "Has balance" },
    { key: "partial" as FilterMode, label: "Partial" },
    { key: "settled" as FilterMode, label: "Settled" },
  ]

  const filterOptions = activeTab === "supplier" ? supplierFilterOptions : customerFilterOptions

  return (
    <>
      <DashboardHeader
        title="Debts Management"
        description="Track supplier debts and customer outstanding balances"
      />
      
      <div className="space-y-6 container mx-auto py-4 sm:px-6 lg:px-8 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="size-4 text-red-600" />
              <span className="text-sm font-medium text-red-900 dark:text-red-100">You owe suppliers</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-red-600">
              {formatCurrency(supplierTotals.youOwe)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid balance across all orders
            </p>
          </Card>

          <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="size-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Suppliers owe you</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-orange-600">
              {formatCurrency(supplierTotals.theyOweValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {supplierTotals.theyOweCases} cases not delivered
            </p>
          </Card>

          <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Customers owe you</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-blue-600">
              {formatCurrency(customerTotals.totalOwed)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {customerTotals.activeCustomers} customers with outstanding balance
            </p>
          </Card>

          <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Overview</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-green-600">
              {customerTotals.totalSales}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sales across {customerDebts.length} customers
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="supplier" className="w-full" onValueChange={(v) => setActiveTab(v as DebtType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Building2 className="size-4" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="size-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          {/* Search + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "supplier" ? "Search product or supplier..." : "Search customer..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filter === f.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier Debts Tab */}
          <TabsContent value="supplier" className="mt-4">
            {filteredSupplierDebts.length === 0 && (
              <Card className="p-10 text-center">
                <PackageX className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No supplier debts match this view</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {supplierDebts.length === 0
                    ? "Once you record supplier orders and payments, debts will show up here."
                    : "Try a different search or filter."}
                </p>
              </Card>
            )}

            <div className="space-y-4">
              {bySupplier.map(([supplier, items]) => {
                const supplierYouOwe = items.reduce((sum, d) => sum + d.youOwe, 0)
                const supplierTheyOweValue = items.reduce((sum, d) => sum + d.theyOweValue, 0)
                const isCollapsed = collapsed[supplier]

                return (
                  <Card key={supplier} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSupplier(supplier)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCollapsed ? (
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{supplier}</span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length} product{items.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs shrink-0">
                        {supplierYouOwe > 0 && (
                          <span className="text-red-600 font-medium">
                            You owe {formatCurrency(supplierYouOwe)}
                          </span>
                        )}
                        {supplierTheyOweValue > 0 && (
                          <span className="text-orange-600 font-medium">
                            Owed {formatCurrency(supplierTheyOweValue)}
                          </span>
                        )}
                        {supplierYouOwe === 0 && supplierTheyOweValue === 0 && (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            Settled
                          </span>
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="divide-y border-t">
                        {items.map((d) => (
                          <div key={d.id} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-4 sm:items-center">
                            <div className="sm:col-span-1 min-w-0">
                              <p className="font-medium truncate">{d.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {d.brand ? `${d.brand} • ` : ""}
                                {d.category}
                              </p>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{d.received}</span> / {d.requested} cases received
                            </div>

                            <div className={cn("text-sm font-medium", d.youOwe > 0 ? "text-red-600" : "text-green-600")}>
                              {d.youOwe > 0 ? `You owe ${formatCurrency(d.youOwe)}` : "Paid in full"}
                            </div>

                            <div className={cn("text-sm font-medium", d.theyOweCases > 0 ? "text-orange-600" : "text-green-600")}>
                              {d.theyOweCases > 0
                                ? `Owed ${d.theyOweCases} case${d.theyOweCases === 1 ? "" : "s"} (${formatCurrency(d.theyOweValue)})`
                                : "Fully delivered"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Customer Debts Tab */}
          <TabsContent value="customer" className="mt-4">
            {filteredCustomerDebts.length === 0 && (
              <Card className="p-10 text-center">
                <Users className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No customer debts match this view</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customerDebts.length === 0
                    ? "Once you record sales to customers, debts will show up here."
                    : `Try a different search or filter. Found ${customerDebts.length} customers total.`}
                </p>
              </Card>
            )}

            <div className="space-y-4">
              {filteredCustomerDebts.map((customer) => (
                <Card key={customer.id || customer.name} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* Customer header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <User className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{customer.totalSales} sale{customer.totalSales === 1 ? "" : "s"}</span>
                              <span>•</span>
                              <span>Last: {new Date(customer.lastSaleDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(
                            customer.totalBalance === 0 ? "paid" : 
                            customer.totalPaid === 0 ? "unpaid" : "partial"
                          )}
                        </div>
                      </div>

                      {/* Customer stats */}
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Amount</p>
                          <p className="text-sm font-medium">{formatCurrency(customer.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Paid</p>
                          <p className="text-sm font-medium text-green-600">{formatCurrency(customer.totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                          <p className={cn(
                            "text-sm font-bold",
                            customer.totalBalance > 0 ? "text-blue-600" : "text-green-600"
                          )}>
                            {formatCurrency(customer.totalBalance)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment Status</p>
                          <p className="text-sm font-medium capitalize">
                            {customer.totalBalance === 0 ? "✅ Settled" : 
                             customer.totalPaid === 0 ? "⚠️ Unpaid" : "🔄 Partial"}
                          </p>
                        </div>
                      </div>

                      {/* Sales history with payment details */}
                      {customer.sales.length > 0 && (
                        <div className="mt-2 border-t pt-3">
                          <button
                            type="button"
                            onClick={() => toggleSupplier(customer.name)}
                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            {collapsed[customer.name] ? (
                              <ChevronRight className="size-3" />
                            ) : (
                              <ChevronDown className="size-3" />
                            )}
                            View sale{customer.sales.length === 1 ? "" : "s"} history
                          </button>
                          
                          {!collapsed[customer.name] && (
                            <div className="mt-3 space-y-2">
                              {customer.sales.map((sale) => (
                                <div key={sale.id} className="rounded-lg border bg-muted/30 p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Receipt className="size-4 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                          {sale.receiptNo || sale.invoiceNumber}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Calendar className="size-3" />
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                        <span>•</span>
                                        <span>{sale.items.length} item{sale.items.length === 1 ? "" : "s"}</span>
                                        <span>•</span>
                                        <span className="capitalize">{sale.paymentMethod}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">{formatCurrency(sale.total)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Paid: {formatCurrency(sale.amountPaid)}
                                        {sale.remainingBalance > 0 && (
                                          <span className="text-blue-600 ml-1">
                                            • Balance: {formatCurrency(sale.remainingBalance)}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Payment details - Now displays the payment info directly from the sale */}
                                  {loadingPayments[sale.id] ? (
                                    <div className="mt-2 text-xs text-muted-foreground">Loading payments...</div>
                                  ) : paymentHistory[sale.id] && paymentHistory[sale.id].length > 0 ? (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <CreditCard className="size-3" />
                                        Payment Details
                                      </div>
                                      <div className="mt-1 space-y-1">
                                        {(paymentHistory[sale.id] || []).map((payment) => (
                                          <div key={payment.id} className="flex items-center justify-between rounded bg-background/50 p-2 text-xs">
                                            <div className="flex items-center gap-2">
                                              <CreditCard className="size-3 text-muted-foreground" />
                                              <span className="capitalize font-medium">{payment.method}</span>
                                              <span className="text-muted-foreground">•</span>
                                              <span className="text-muted-foreground">Received by: {payment.receivedBy}</span>
                                              {payment.note && (
                                                <>
                                                  <span className="text-muted-foreground">•</span>
                                                  <span className="text-muted-foreground">Note: {payment.note}</span>
                                                </>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                              <span className="text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <div>No payment details available</div>
                                      <button
                                        className="text-xs text-primary-600 mt-1"
                                        onClick={() => fetchPaymentHistory(sale.id)}
                                      >
                                        Load payments
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

export default Depts