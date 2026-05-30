"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatNumber, formatDate, getStockStatus, daysUntil } from "@/lib/format"
import type { Product, StockStatus } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ProductForm, type ProductFormValues } from "@/components/inventory/product-form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StockStatus | "all">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase()) ||
        p.batchNumber.toLowerCase().includes(query.toLowerCase())
      const matchStatus = status === "all" || getStockStatus(p) === status
      return matchQuery && matchStatus
    })
  }, [products, query, status])

  function handleAdd(values: ProductFormValues) {
    addProduct(values)
    setAddOpen(false)
    toast.success(`${values.name} added to inventory`)
  }

  function handleEdit(values: ProductFormValues) {
    if (!editing) return
    updateProduct(editing.id, values)
    setEditing(null)
    toast.success("Product updated")
  }

  function handleDelete() {
    if (!deleting) return
    deleteProduct(deleting.id)
    toast.success(`${deleting.name} removed`)
    setDeleting(null)
  }

  return (
    <>
      <DashboardHeader title="Inventory" description="Manage your beer stock" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, brand, batch..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as StockStatus | "all")}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add new beer stock</DialogTitle>
                <DialogDescription>Enter product details to add to inventory.</DialogDescription>
              </DialogHeader>
              <ProductForm onSubmit={handleAdd} submitLabel="Add to inventory" />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Full Cases</TableHead>
                  <TableHead className="text-right">Empty</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const d = daysUntil(p.expiryDate)
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.brand} · {p.batchNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(p.fullCases)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatNumber(p.emptyCases)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.sellingPrice)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatDate(p.expiryDate)}</span>
                          <span className="text-xs text-muted-foreground">
                            {d < 0 ? "Expired" : `${d} days left`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getStockStatus(p)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(p)}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <Package className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No products match your filters.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filtered.length} of {products.length} products
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/add">
              <Plus className="size-4" />
              Add stock page
            </Link>
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update product details and stock levels.</DialogDescription>
          </DialogHeader>
          {editing && <ProductForm initial={editing} onSubmit={handleEdit} submitLabel="Save changes" />}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
