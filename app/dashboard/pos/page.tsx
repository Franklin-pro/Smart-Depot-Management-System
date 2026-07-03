"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  Beer,
  X,
  CheckCircle,
  Package,
  RotateCcw,
  Calculator,
  ChevronDown,
  User,
  CreditCard,
  Percent,
  ReceiptText,
  AlertCircle,
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, getStockStatus, daysUntil } from "@/lib/format"
import type { Product, PaymentMethod, Sale, SaleItem } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Receipt } from "@/components/pos/receipt"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { salesService } from "@/services"
import { cn } from "@/lib/utils"

type CartLine = SaleItem & {
  max: number
  emptyCasesReturned?: number
  remainingEmptyCases?: number
}

const payments: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
]

export default function PosPage() {
  const { products, customers, currentUser, addSale, setSales } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState<string>("walk-in")
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(10)
  const [payment, setPayment] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [completed, setCompleted] = useState<Sale | null>(null)
  const [mounted, setMounted] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const cartScrollRef = useRef<HTMLDivElement>(null)

  const [partialPayment, setPartialPayment] = useState<number>(0)
  const [isPartialPayment, setIsPartialPayment] = useState(false)
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())

  // Fetch sales on mount
  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true)
      try {
        const data = await salesService.getAll()
        setSales(data)
      } catch (error) {
        console.error("Failed to fetch sales:", error)
        toast.error("Failed to load sales")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [setSales])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll to bottom when cart updates
  useEffect(() => {
    if (cartScrollRef.current && cart.length > 2) {
      cartScrollRef.current.scrollTop = cartScrollRef.current.scrollHeight
    }
  }, [cart])

  // Memoized product list
  const sellable = useMemo(
    () =>
      products.filter((p) => {
        const status = getStockStatus(p)
        const matches =
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase())
        return matches && status !== "expired" && p.fullCases > 0
      }),
    [products, query],
  )

  // Cart calculations
  const cartQtyByProduct = useMemo(() => {
    const map = new Map<string, number>()
    cart.forEach((i) => map.set(i.productId, i.quantity))
    return map
  }, [cart])

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)
  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = (subtotal - discount) * (tax / 100)
  const total = Math.max(0, subtotal - discount + taxAmount)
  const remainingBalance = isPartialPayment ? Math.max(0, total - partialPayment) : 0
  const change = Math.max(0, amountPaid - total)

  const totalEmptyReturned = cart.reduce((s, i) => s + (i.emptyCasesReturned || 0), 0)
  const totalEmptyRemaining = cart.reduce((s, i) => s + (i.remainingEmptyCases || 0), 0)

  // Cart actions
  function addToCart(p: Product) {
    if (daysUntil(p.expiryDate) < 0) {
      toast.error(`${p.name} is expired and cannot be sold`)
      return
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id)
      if (existing) {
        if (existing.quantity >= p.fullCases) {
          toast.error(`Only ${p.fullCases} cases of ${p.name} available`)
          return prev
        }
        return prev.map((i) =>
          i.productId === p.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i,
        )
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          quantity: 1,
          unitPrice: p.sellingPrice,
          subtotal: p.sellingPrice,
          max: p.fullCases,
          emptyCasesReturned: 0,
          remainingEmptyCases: 0,
        } as CartLine,
      ]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== id) return i
          const next = i.quantity + delta
          if (next > i.max) {
            toast.error(`Only ${i.max} cases available`)
            return i
          }
          return { ...i, quantity: next, subtotal: next * i.unitPrice }
        })
        .filter((i) => i.quantity > 0),
    )
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((i) => i.productId !== id))
    setExpandedCases((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function updateEmptyCases(productId: string, returned: number, remaining: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, emptyCasesReturned: returned, remainingEmptyCases: remaining }
          : i,
      ),
    )
  }

  function toggleExpandCases(productId: string) {
    setExpandedCases((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  function resetSale() {
    setCart([])
    setDiscount(0)
    setTax(10)
    setAmountPaid(0)
    setPayment("cash")
    setCustomerId("walk-in")
    setPartialPayment(0)
    setIsPartialPayment(false)
    setExpandedCases(new Set())
  }

  // Checkout
  async function checkout() {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (isPartialPayment) {
      if (partialPayment <= 0) {
        toast.error("Please enter a partial payment amount")
        return
      }
      if (partialPayment >= total) {
        toast.error("Partial payment must be less than total")
        return
      }
    } else {
      if (amountPaid < total) {
        toast.error("Amount paid is less than total")
        return
      }
    }

    try {
      const customer = customers.find((c) => c.id === customerId)

      const saleData: any = {
        customerId: customer?.id,
        customerName: customer?.name ?? "Walk-in Customer",
        items: cart.map(
          ({ productId, name, quantity, unitPrice, subtotal, emptyCasesReturned, remainingEmptyCases }) => ({
            productId,
            name,
            quantity,
            unitPrice,
            subtotal,
            emptyCasesReturned: emptyCasesReturned || 0,
            remainingEmptyCases: remainingEmptyCases || 0,
          }),
        ),
        discount,
        tax,
        payment,
        amountPaid: isPartialPayment ? partialPayment : amountPaid,
        isPartialPayment,
        remainingBalance: isPartialPayment ? remainingBalance : 0,
        cashier: currentUser?.name ?? "Cashier",
        emptyCasesTotal: totalEmptyReturned,
        remainingEmptyCasesTotal: totalEmptyRemaining,
      }

      const sale = await addSale(saleData)
      setCompleted(sale)
      resetSale()
      toast.success(isPartialPayment ? "Partial payment recorded" : "Sale completed")

      const updatedSales = await salesService.getAll()
      setSales(updatedSales)
    } catch (error: any) {
      console.error("Failed to complete sale:", error)
      const errorMsg = error.response?.data?.detail?.[0]?.msg || "Failed to complete sale"
      toast.error(errorMsg)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader title="Point of Sale" description="Fast beer selling interface" />
        <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[132px] animate-pulse rounded-xl border border-border bg-muted/60" />
              ))}
            </div>
          </div>
          <Card className="h-[420px] animate-pulse bg-muted/40" />
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Point of Sale" description="Fast beer selling interface" />
      <div className="grid flex-1 grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[1fr_440px]">
        {/* Product Catalog */}
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search beers by name or brand..."
              className="pl-9 pr-9 h-11 bg-background"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {sellable.map((p) => {
              const status = getStockStatus(p)
              const inCartQty = cartQtyByProduct.get(p.id) ?? 0
              const isLowStock = p.fullCases <= 5
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md active:scale-[0.98]",
                    inCartQty > 0 
                      ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5" 
                      : "border-border hover:border-primary/30",
                  )}
                >
                  {inCartQty > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shadow-md">
                      {inCartQty}
                    </span>
                  )}

                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Beer className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.brand}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-base font-semibold">{formatCurrency(p.sellingPrice)}</span>
                    {status === "expiring" && (
                      <Badge variant="outline" className="border-amber-400/50 text-[10px] text-amber-600 dark:text-amber-400 px-1.5 py-0">
                        Expiring
                      </Badge>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-xs",
                      isLowStock ? "font-medium text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {p.fullCases} case{p.fullCases === 1 ? "" : "s"} left
                  </span>
                </button>
              )
            })}
            {sellable.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-3 py-20 text-center">
                <Search className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {query ? `No beers matching "${query}"` : "No products available"}
                  </p>
                  {query && (
                    <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Order (Cart) */}
        <Card className="flex h-fit max-h-[calc(100vh-7rem)] flex-col overflow-hidden shadow-lg lg:sticky lg:top-20">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <ShoppingCart className="size-4" />
              </div>
              <span className="font-medium">Current Order</span>
              {mounted && itemCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-2.5 py-0.5">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Badge>
              )}
            </div>
            {mounted && cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSale}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Scrollable Items */}
          <div 
            ref={cartScrollRef}
            className="min-h-0 flex-1 overflow-y-auto bg-background scroll-smooth"
            style={{
              maxHeight: cart.length > 2 ? '400px' : 'auto',
            }}
          >
            <div className="divide-y divide-border/60">
              {(!mounted || cart.length === 0) && (
                <div className="flex flex-col items-center gap-3 py-20">
                  <div className="rounded-full bg-muted/50 p-4">
                    <Beer className="size-8 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No items in order</p>
                    <p className="text-xs text-muted-foreground/60">Tap a beer to add it</p>
                  </div>
                </div>
              )}

              {mounted &&
                cart.map((i) => {
                  const isExpanded = expandedCases.has(i.productId)
                  const hasCases = (i.emptyCasesReturned || 0) > 0 || (i.remainingEmptyCases || 0) > 0
                  return (
                    <div key={i.productId} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Beer className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(i.unitPrice)} / case
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQty(i.productId, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQty(i.productId, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>

                        <div className="min-w-[80px] shrink-0 text-right">
                          <span className="text-sm font-semibold">
                            {formatCurrency(i.quantity * i.unitPrice)}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeLine(i.productId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {/* Empty Cases */}
                      <div className="mt-2 pl-12">
                        <button
                          onClick={() => toggleExpandCases(i.productId)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Package className="size-3.5" />
                          {hasCases ? (
                            <span className="text-primary font-medium">
                              {i.emptyCasesReturned || 0} returned
                              {(i.remainingEmptyCases || 0) > 0 && ` · ${i.remainingEmptyCases} owed`}
                            </span>
                          ) : (
                            "Track empty cases"
                          )}
                          <ChevronDown
                            className={cn("size-3.5 transition-transform", isExpanded && "rotate-180")}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="size-3.5 shrink-0 text-muted-foreground" />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Returned"
                                className="h-7 text-xs"
                                value={i.emptyCasesReturned || ""}
                                onChange={(e) =>
                                  updateEmptyCases(
                                    i.productId,
                                    parseInt(e.target.value) || 0,
                                    i.remainingEmptyCases || 0,
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Still owed"
                                className="h-7 text-xs"
                                value={i.remainingEmptyCases || ""}
                                onChange={(e) =>
                                  updateEmptyCases(
                                    i.productId,
                                    i.emptyCasesReturned || 0,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Footer - Payment Section */}
          <div className="shrink-0 border-t border-border bg-muted/30">
            {/* Customer & Payment */}
            <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3" />
                  Customer
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="size-3" />
                  Payment
                </Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
                  <SelectTrigger className="h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payments.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount & Tax */}
            <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Percent className="size-3" />
                  Discount (RWF)
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ReceiptText className="size-3" />
                  Tax (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-9 text-sm"
                  value={tax || ""}
                  onChange={(e) => setTax(Number(e.target.value))}
                />
              </div>
            </div>
                   {/* Partial Payment Toggle */}
            <div className="border-b border-border p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Partial Payment</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    {isPartialPayment ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <button
                  role="switch"
                  aria-checked={isPartialPayment}
                  onClick={() => {
                    setIsPartialPayment((v) => !v)
                    if (!isPartialPayment) {
                      setPartialPayment(total)
                    } else {
                      setPartialPayment(0)
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isPartialPayment ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      isPartialPayment ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
              
              {isPartialPayment && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">RWF</span>
                      <Input
                        type="number"
                        min={0}
                        max={total > 0 ? total : undefined}
                        step={100}
                        className="h-10 pl-12 pr-3 text-sm"
                        placeholder="Enter amount received"
                        value={partialPayment || ""}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (value <= total || total === 0) {
                            setPartialPayment(value)
                          } else {
                            toast.error("Amount cannot exceed total")
                          }
                        }}
                      />
                    </div>
                    {partialPayment > 0 && partialPayment < total && (
                      <div className="shrink-0">
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 whitespace-nowrap">
                          <span className="mr-1">•</span>
                          Remaining: {formatCurrency(remainingBalance)}
                        </Badge>
                      </div>
                    )}
                    {partialPayment >= total && partialPayment > 0 && (
                      <div className="shrink-0">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap">
                          <CheckCircle className="size-3 mr-1 inline" />
                          Paid in full
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Amount Buttons - Only show when partial payment is enabled */}
                  {total > 0 && isPartialPayment && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPartialPayment(Math.round(total * 0.25))}
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPartialPayment(Math.round(total * 0.5))}
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPartialPayment(Math.round(total * 0.75))}
                      >
                        75%
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPartialPayment(total)}
                      >
                        100%
                      </Button>
                    </div>
                  )}
                  
                  {/* Progress Indicator */}
                  {partialPayment > 0 && partialPayment <= total && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Paid: {formatCurrency(partialPayment)}</span>
                        <span>Total: {formatCurrency(total)}</span>
                        <span className="font-medium text-primary">
                          {Math.round((partialPayment / total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${Math.min((partialPayment / total) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Warning */}
                  {partialPayment > total && partialPayment > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="size-3.5" />
                      <span>Partial payment cannot exceed the total amount</span>
                    </div>
                  )}
                  
                  {/* Success Message */}
                  {partialPayment === total && total > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="size-3.5" />
                      <span>Full amount will be paid with this transaction</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount Paid - Full Payment */}
            {!isPartialPayment && (
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <Calculator className="size-4 text-muted-foreground shrink-0" />
                  <Label className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Amount Paid
                  </Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">RWF</span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      className="h-9 pl-12 pr-3 text-sm"
                      placeholder="Enter amount"
                      value={amountPaid || ""}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setAmountPaid(value)
                      }}
                      onFocus={() => {
                        if (amountPaid === 0 && total > 0) {
                          setAmountPaid(total)
                        }
                      }}
                    />
                  </div>
                  {amountPaid > 0 && amountPaid < total && (
                    <Badge variant="outline" className="shrink-0 text-xs border-amber-400/50 text-amber-600 dark:text-amber-400">
                      Needs {formatCurrency(total - amountPaid)} more
                    </Badge>
                  )}
                  {amountPaid >= total && amountPaid > 0 && (
                    <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <CheckCircle className="size-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                </div>
                
            
                
                {/* Progress Indicator */}
                {amountPaid > 0 && amountPaid <= total && !isPartialPayment && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Paid: {formatCurrency(amountPaid)}</span>
                      <span>Total: {formatCurrency(total)}</span>
                      <span className="font-medium text-primary">
                        {Math.round((amountPaid / total) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${Math.min((amountPaid / total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Change Due */}
                {!isPartialPayment && mounted && change > 0 && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Change Due</span>
                    <span className="text-lg font-bold">{formatCurrency(change)}</span>
                  </div>
                )}
                
                {/* Insufficient Payment Warning */}
                {!isPartialPayment && amountPaid > 0 && amountPaid < total && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3.5" />
                    <span>Amount paid is less than total. Please enter full amount or enable partial payment.</span>
                  </div>
                )}
              </div>
            )}

     

            {/* Totals */}
            <div className="p-4 space-y-2 bg-background">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-destructive">-{formatCurrency(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({tax}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-border pt-3 mt-2">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-2xl font-bold tracking-tight">{formatCurrency(total)}</span>
              </div>
              {isPartialPayment && partialPayment > 0 && (
                <div className="flex justify-between text-sm font-medium text-amber-600 dark:text-amber-400">
                  <span>Remaining Balance</span>
                  <span>{formatCurrency(remainingBalance)}</span>
                </div>
              )}
              {!isPartialPayment && mounted && change > 0 && (
                <div className="flex justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Change Due</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {/* Empty Cases Summary */}
            {(totalEmptyReturned > 0 || totalEmptyRemaining > 0) && (
              <div className="border-t border-border bg-muted/20 px-4 py-2.5">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5" />
                    <span className="font-medium">Returned:</span> {totalEmptyReturned}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="size-3.5" />
                    <span className="font-medium">Owed:</span> {totalEmptyRemaining}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <div className="p-4 bg-background">
              <Button
                size="lg"
                className="h-12 w-full gap-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                onClick={checkout}
                disabled={mounted && cart.length === 0}
              >
                <CheckCircle className="size-4" />
                {isPartialPayment ? `Record ${formatCurrency(partialPayment)} payment` : "Complete Sale"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={!!completed} onOpenChange={(o) => !o && setCompleted(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="size-5" />
              Sale Receipt
            </DialogTitle>
          </DialogHeader>
          {completed && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <Receipt ref={receiptRef} sale={completed} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCompleted(null)}>
                  <X className="size-4 mr-2" /> Close
                </Button>
                <Button className="flex-1" onClick={() => window.print()}>
                  <Printer className="size-4 mr-2" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}