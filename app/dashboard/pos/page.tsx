"use client"

import { useMemo, useRef, useState } from "react"
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
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, getStockStatus, daysUntil } from "@/lib/format"
import type { Product, PaymentMethod, Sale, SaleItem } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Receipt } from "@/components/pos/receipt"
import { Card, CardContent } from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"

type CartLine = SaleItem & { max: number }

const payments: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
]

export default function PosPage() {
  const { products, customers, currentUser, addSale } = useApp()
  const [query, setQuery] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState<string>("walk-in")
  const [discount, setDiscount] = useState(0)
  const [payment, setPayment] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [completed, setCompleted] = useState<Sale | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

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
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.sellingPrice, max: p.fullCases }]
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
          return { ...i, quantity: next }
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

  function checkout() {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    if (amountPaid < total) {
      toast.error("Amount paid is less than total")
      return
    }
    const customer = customers.find((c) => c.id === customerId)
    const sale = addSale({
      customerId: customer?.id,
      customerName: customer?.name ?? "Walk-in Customer",
      items: cart.map(({ productId, name, quantity, unitPrice }) => ({ productId, name, quantity, unitPrice })),
      discount,
      payment,
      amountPaid,
      cashier: currentUser?.name ?? "Cashier",
    })
    setCompleted(sale)
    resetSale()
    toast.success("Sale completed")
  }

  return (
    <>
      <DashboardHeader title="Point of Sale" description="Fast beer selling interface" />
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
                    <p className="truncate text-xs text-muted-foreground">{p.brand}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-semibold">{formatCurrency(p.sellingPrice)}</span>
                    {status === "expiring" && (
                      <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                        Expiring
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{p.fullCases} cases left</span>
                </button>
              )
            })}
            {sellable.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No products found</p>
            )}
          </div>
        </div>

        {/* Cart */}
        <Card className="flex h-fit max-h-[calc(100vh-7rem)] flex-col lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              <span className="font-semibold">Current Order</span>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={resetSale} className="h-7 text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-64 flex-1">
            <div className="flex flex-col divide-y divide-border">
              {cart.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">Tap a beer to add it</p>
              )}
              {cart.map((i) => (
                <div key={i.productId} className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(i.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-7" onClick={() => changeQty(i.productId, -1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{i.quantity}</span>
                    <Button variant="outline" size="icon" className="size-7" onClick={() => changeQty(i.productId, 1)}>
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(i.productId)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex flex-col gap-3 border-t border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs">Payment</Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-xs">Discount (RWF)</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Amount Paid</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Change</span>
                <span>{formatCurrency(change)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={checkout} disabled={cart.length === 0}>
              Complete Sale
            </Button>
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
