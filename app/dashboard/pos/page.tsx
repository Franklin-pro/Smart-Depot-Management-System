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

type CartLine = SaleItem & { max: number }

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
  const [payment, setPayment] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [completed, setCompleted] = useState<Sale | null>(null)
  const [mounted, setMounted] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // ✅ Fetch sales from API on mount
  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true)
      try {
        const data = await salesService.getAll()
        setSales(data)
      } catch (error) {
        console.error('Failed to fetch sales:', error)
        toast.error('Failed to load sales')
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

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const total = Math.max(0, subtotal - discount)
  const change = Math.max(0, amountPaid - total)

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
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i,
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
  }

  function resetSale() {
    setCart([])
    setDiscount(0)
    setAmountPaid(0)
    setPayment("cash")
    setCustomerId("walk-in")
  }

  // ✅ Updated checkout to use API
  async function checkout() {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    if (amountPaid < total) {
      toast.error("Amount paid is less than total")
      return
    }

    try {
      const customer = customers.find((c) => c.id === customerId)
      const saleData = {
        customerId: customer?.id,
        customerName: customer?.name ?? "Walk-in Customer",
        items: cart.map(({ productId, name, quantity, unitPrice, subtotal }) => ({
          productId,
          name,
          quantity,
          unitPrice,
          subtotal,
        })),
        discount,
        payment,
        amountPaid,
        cashier: currentUser?.name ?? "Cashier",
      }

      // ✅ Use the store's addSale which calls the API
      const sale = await addSale(saleData)
      setCompleted(sale)
      resetSale()
      toast.success("Sale completed")

      // Refresh sales data
      const updatedSales = await salesService.getAll()
      setSales(updatedSales)

    } catch (error) {
      console.error('Failed to complete sale:', error)
      toast.error('Failed to complete sale')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Point of Sale"
        description="Fast beer selling interface"
      />
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:p-6 lg:grid-cols-[1fr_380px]">
        {/* Product catalog */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search beers..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {sellable.map((p) => {
              const status = getStockStatus(p)
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Beer className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.brand}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {formatCurrency(p.sellingPrice)}
                    </span>
                    {status === "expiring" && (
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-[10px] text-primary"
                      >
                        Expiring
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {p.fullCases} cases left
                  </span>
                </button>
              )
            })}
            {sellable.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No products found
              </p>
            )}
          </div>
        </div>

        {/* Current Order (Cart) */}
        <Card className="flex h-fit max-h-[calc(100vh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
          {/* Header - fixed */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <span>Current order</span>
              {mounted && cart.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-none text-primary">
                  {cart.length}
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

          {/* Scrollable items area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y divide-border">
              {/* Empty state */}
              {(!mounted || cart.length === 0) && (
                <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                  <Beer className="size-7 opacity-30" />
                  <span>Tap a beer to add it</span>
                </div>
              )}
              
              {/* Cart items */}
              {mounted &&
                cart.map((i) => (
                  <div
                    key={i.productId}
                    className="flex items-center gap-2.5 px-4 py-2.5"
                  >
                    {/* Icon */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Beer className="size-4 text-muted-foreground" />
                    </div>

                    {/* Name + unit price */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight">
                        {i.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {formatCurrency(i.unitPrice)} / case
                      </p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-[26px]"
                        onClick={() => changeQty(i.productId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-5 text-center text-[13px] font-medium">
                        {i.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-[26px]"
                        onClick={() => changeQty(i.productId, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    {/* Line total */}
                    <span className="min-w-[72px] shrink-0 text-right text-[13px] font-medium">
                      {formatCurrency(i.quantity * i.unitPrice)}
                    </span>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeLine(i.productId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Footer - fixed at bottom */}
          <div className="shrink-0 border-t border-border">
            {/* Form fields */}
            <div className="grid grid-cols-2 gap-2.5 border-b border-border p-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Customer
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-[34px] text-[13px] w-full">
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
                <Select
                  value={payment}
                  onValueChange={(v) => setPayment(v as PaymentMethod)}
                >
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
                  Amount paid
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="h-[34px] w-full text-[13px]"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-[15px] font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {mounted && change > 0 && (
                <div className="flex justify-between text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span>Change</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {/* Checkout button */}
            <div className="px-4 pb-4">
              <Button
                size="lg"
                className="h-[42px] w-full gap-2 text-sm"
                onClick={checkout}
                disabled={mounted && cart.length === 0}
              >
                <CheckCircle className="size-4" />
                Complete sale
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Receipt dialog */}
      <Dialog open={!!completed} onOpenChange={(o) => !o && setCompleted(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {completed && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border">
                <Receipt ref={receiptRef} sale={completed} />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCompleted(null)}
                >
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