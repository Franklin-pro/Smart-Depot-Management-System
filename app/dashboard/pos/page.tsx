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
  RefreshCw,
  Package,
  RotateCcw,
  Calculator,
  ChevronDown,
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
  const { products, customers, currentUser, addSale, setSales, sales } = useApp()
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

  // Partial payment
  const [partialPayment, setPartialPayment] = useState<number>(0)
  const [isPartialPayment, setIsPartialPayment] = useState(false)

  // Which cart lines have their "empty cases" tracker expanded
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())

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
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[1fr_420px]">
        {/* Product catalog */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search beers by name or brand..."
              className="pl-9 pr-9 h-11"
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
                    "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-all",
                    "hover:border-primary hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]",
                    inCartQty > 0 ? "border-primary/50 ring-1 ring-primary/20" : "border-border",
                  )}
                >
                  {inCartQty > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground shadow">
                      {inCartQty}
                    </span>
                  )}

                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Beer className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.brand}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-semibold">{formatCurrency(p.sellingPrice)}</span>
                    {status === "expiring" && (
                      <Badge variant="outline" className="border-amber-400/50 text-[10px] text-amber-600 dark:text-amber-400">
                        Expiring
                      </Badge>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[11px]",
                      isLowStock ? "font-medium text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {p.fullCases} case{p.fullCases === 1 ? "" : "s"} left
                  </span>
                </button>
              )
            })}
            {sellable.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                <Search className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {query ? `No beers matching "${query}"` : "No products available"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current Order (Cart) */}
        <Card className="flex h-fit max-h-[calc(100vh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <span>Current order</span>
              {mounted && itemCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            {mounted && cart.length > 0 && (
              <button
                onClick={resetSale}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Scrollable items */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border">
              {(!mounted || cart.length === 0) && (
                <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
                  <Beer className="size-8 opacity-25" />
                  <span>Tap a beer to add it to the order</span>
                </div>
              )}

              {mounted &&
                cart.map((i) => {
                  const isExpanded = expandedCases.has(i.productId)
                  const hasCases = (i.emptyCasesReturned || 0) > 0 || (i.remainingEmptyCases || 0) > 0
                  return (
                    <div key={i.productId} className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Beer className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium leading-tight">{i.name}</p>
                          <p className="text-[12px] text-muted-foreground">
                            {formatCurrency(i.unitPrice)} / case
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-[26px]"
                            onClick={() => changeQty(i.productId, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-5 text-center text-[13px] font-medium">{i.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-[26px]"
                            onClick={() => changeQty(i.productId, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>

                        <span className="min-w-[72px] shrink-0 text-right text-[13px] font-medium">
                          {formatCurrency(i.quantity * i.unitPrice)}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeLine(i.productId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {/* Empty cases — collapsed by default to keep the list scannable */}
                      <div className="mt-1.5 pl-11">
                        <button
                          onClick={() => toggleExpandCases(i.productId)}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Package className="size-3" />
                          {hasCases ? (
                            <span className="text-primary">
                              {i.emptyCasesReturned || 0} returned
                              {(i.remainingEmptyCases || 0) > 0 && ` · ${i.remainingEmptyCases} owed`}
                            </span>
                          ) : (
                            "Track empty cases"
                          )}
                          <ChevronDown
                            className={cn("size-3 transition-transform", isExpanded && "rotate-180")}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 grid grid-cols-2 gap-2">
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

          {/* Footer */}
          <div className="shrink-0 border-t border-border">
            <div className="grid grid-cols-2 gap-2.5 border-b border-border p-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Customer
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-[34px] w-full text-[13px]">
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

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Payment
                </Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
                  <SelectTrigger className="h-[34px] w-full text-[13px]">
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

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Discount (RWF)
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="h-[34px] w-full text-[13px]"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Tax (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-[34px] w-full text-[13px]"
                  value={tax || ""}
                  onChange={(e) => setTax(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Amount paid (only shown for full payment) */}
            {!isPartialPayment && (
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Calculator className="size-3.5 shrink-0 text-muted-foreground" />
                  <Label className="shrink-0 text-[11px] text-muted-foreground">Amount paid</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    className="h-[30px] flex-1 text-[13px]"
                    placeholder="0"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Partial payment */}
            <div className="border-b border-border px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Partial payment</span>
                <button
                  role="switch"
                  aria-checked={isPartialPayment}
                  onClick={() => setIsPartialPayment((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    isPartialPayment ? "bg-primary" : "bg-muted-foreground/25",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                      isPartialPayment ? "translate-x-[18px]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
              {isPartialPayment && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    className="h-[30px] flex-1 text-[13px]"
                    placeholder="Amount received now"
                    value={partialPayment || ""}
                    onChange={(e) => setPartialPayment(Number(e.target.value))}
                  />
                  {partialPayment > 0 && (
                    <Badge variant="outline" className="shrink-0 whitespace-nowrap text-[11px]">
                      Owes {formatCurrency(remainingBalance)}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>Tax ({tax}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
                <span className="text-[13px] font-medium text-muted-foreground">Total</span>
                <span className="text-xl font-semibold tracking-tight">{formatCurrency(total)}</span>
              </div>
              {isPartialPayment && partialPayment > 0 && (
                <div className="flex justify-between text-[13px] font-medium text-amber-600 dark:text-amber-400">
                  <span>Remaining balance</span>
                  <span>{formatCurrency(remainingBalance)}</span>
                </div>
              )}
              {!isPartialPayment && mounted && change > 0 && (
                <div className="flex justify-between text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Change due</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {/* Empty cases summary */}
            {(totalEmptyReturned > 0 || totalEmptyRemaining > 0) && (
              <div className="border-t border-border bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="size-3" />
                    Returned: {totalEmptyReturned}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="size-3" />
                    Owed: {totalEmptyRemaining}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout */}
            <div className="px-4 pb-4 pt-3">
              <Button
                size="lg"
                className="h-[44px] w-full gap-2 text-sm"
                onClick={checkout}
                disabled={mounted && cart.length === 0}
              >
                <CheckCircle className="size-4" />
                {isPartialPayment ? `Record ${formatCurrency(partialPayment)} payment` : "Complete sale"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Receipt dialog */}
      <Dialog open={!!completed} onOpenChange={(o) => !o && setCompleted(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sale receipt</DialogTitle>
          </DialogHeader>
          {completed && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border">
                <Receipt ref={receiptRef} sale={completed} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCompleted(null)}>
                  <X className="size-4" /> Close
                </Button>
                <Button className="flex-1" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}