"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Truck, Phone, Mail } from "lucide-react"
import { useApp } from "@/lib/store"
import { formatDate } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SuppliersPage() {
  const { suppliers, addSupplier } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "" })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    addSupplier({ ...form, productsSupplied: 0 })
    toast.success(`${form.name} added to suppliers`)
    setForm({ name: "", contact: "", phone: "", email: "" })
    setOpen(false)
  }

  return (
    <>
      <DashboardHeader title="Suppliers" description="Manage supplier records and contacts" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Active suppliers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                <Plus className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {suppliers.reduce((sum, s) => sum + s.productsSupplied, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Products supplied</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex items-center justify-center p-5">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="size-4" /> Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Supplier</DialogTitle>
                  <DialogDescription>Record a new beer supplier or distributor.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s-name">Company name</Label>
                    <Input
                      id="s-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s-contact">Contact person</Label>
                    <Input
                      id="s-contact"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="s-phone">Phone</Label>
                      <Input
                        id="s-phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="s-email">Email</Label>
                      <Input
                        id="s-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Supplier</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="size-3.5" /> {s.phone}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3.5" /> {s.email || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{s.productsSupplied}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
