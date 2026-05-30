"use client"

import { forwardRef } from "react"
import type { Sale } from "@/lib/types"
import { formatCurrency, formatDateTime } from "@/lib/format"

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  mobile: "Mobile Money",
  card: "Card",
  bank: "Bank Transfer",
}

export const Receipt = forwardRef<HTMLDivElement, { sale: Sale }>(function Receipt({ sale }, ref) {
  return (
    <div ref={ref} className="mx-auto w-full max-w-xs bg-card p-5 font-mono text-xs text-card-foreground">
      <div className="text-center">
        <p className="text-sm font-bold tracking-wide">BREWHOUSE DEPOT</p>
        <p className="text-muted-foreground">KK 15 Ave, Kigali</p>
        <p className="text-muted-foreground">Tel: +250 788 000 000</p>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="flex justify-between">
        <span className="text-muted-foreground">Receipt</span>
        <span className="font-semibold">{sale.receiptNo}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Date</span>
        <span>{formatDateTime(sale.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Cashier</span>
        <span>{sale.cashier}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Customer</span>
        <span>{sale.customerName}</span>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="flex flex-col gap-1.5">
        {sale.items.map((i) => (
          <div key={i.productId} className="flex justify-between">
            <span className="min-w-0 truncate pr-2">
              {i.name} x{i.quantity}
            </span>
            <span>{formatCurrency(i.quantity * i.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(sale.subtotal)}</span>
      </div>
      {sale.discount > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Discount</span>
          <span>-{formatCurrency(sale.discount)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(sale.total)}</span>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="flex justify-between">
        <span className="text-muted-foreground">Paid ({paymentLabels[sale.payment]})</span>
        <span>{formatCurrency(sale.amountPaid)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Change</span>
        <span>{formatCurrency(sale.change)}</span>
      </div>
      <div className="my-3 border-t border-dashed border-border" />
      <div className="rounded-md bg-muted/60 p-2 text-center text-[11px]">
        <p className="font-semibold">{sale.expectedEmpties} empty cases expected back</p>
      </div>
      <p className="mt-3 text-center text-muted-foreground">Thank you for your business!</p>
    </div>
  )
})
