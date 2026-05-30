"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = ["Lager", "Premium Lager", "Strong Lager", "Stout", "Ale", "Cider"]

export type ProductFormValues = Omit<Product, "id" | "createdAt">

function toDateInput(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 10)
}

export function ProductForm({
  initial,
  onSubmit,
  submitLabel = "Save product",
}: {
  initial?: Product
  onSubmit: (values: ProductFormValues) => void
  submitLabel?: string
}) {
  const { suppliers } = useApp()
  const [v, setV] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    brand: initial?.brand ?? "",
    category: initial?.category ?? "Lager",
    fullCases: initial?.fullCases ?? 0,
    emptyCases: initial?.emptyCases ?? 0,
    purchasePrice: initial?.purchasePrice ?? 0,
    sellingPrice: initial?.sellingPrice ?? 0,
    supplier: initial?.supplier ?? suppliers[0]?.name ?? "",
    batchNumber: initial?.batchNumber ?? "",
    manufactureDate: initial?.manufactureDate ?? new Date().toISOString(),
    expiryDate: initial?.expiryDate ?? new Date().toISOString(),
    lowStockThreshold: initial?.lowStockThreshold ?? 40,
  })

  function set<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...v,
      manufactureDate: new Date(v.manufactureDate).toISOString(),
      expiryDate: new Date(v.expiryDate).toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Beer name</Label>
          <Input id="name" value={v.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" value={v.brand} onChange={(e) => set("brand", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select value={v.category} onValueChange={(val) => set("category", val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Supplier</Label>
          <Select value={v.supplier} onValueChange={(val) => set("supplier", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="full">Full cases</Label>
          <Input
            id="full"
            type="number"
            min={0}
            value={v.fullCases}
            onChange={(e) => set("fullCases", Number(e.target.value))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="empty">Empty cases</Label>
          <Input
            id="empty"
            type="number"
            min={0}
            value={v.emptyCases}
            onChange={(e) => set("emptyCases", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchase">Purchase price (RWF)</Label>
          <Input
            id="purchase"
            type="number"
            min={0}
            value={v.purchasePrice}
            onChange={(e) => set("purchasePrice", Number(e.target.value))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="selling">Selling price (RWF)</Label>
          <Input
            id="selling"
            type="number"
            min={0}
            value={v.sellingPrice}
            onChange={(e) => set("sellingPrice", Number(e.target.value))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="batch">Batch number</Label>
          <Input id="batch" value={v.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="threshold">Low stock threshold</Label>
          <Input
            id="threshold"
            type="number"
            min={0}
            value={v.lowStockThreshold}
            onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mfg">Manufacture date</Label>
          <Input
            id="mfg"
            type="date"
            value={toDateInput(v.manufactureDate)}
            onChange={(e) => set("manufactureDate", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exp">Expiry date</Label>
          <Input
            id="exp"
            type="date"
            value={toDateInput(v.expiryDate)}
            onChange={(e) => set("expiryDate", e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-2 self-end">
        {submitLabel}
      </Button>
    </form>
  )
}
