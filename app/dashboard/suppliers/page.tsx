"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Truck, Phone, Mail, RefreshCw, Edit2, Trash2 } from "lucide-react"
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
import { suppliersService } from "@/services"

// Type definitions
interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email?: string
  productsSupplied?: number
  createdAt?: string
  updatedAt?: string
}

export default function SuppliersPage() {
  const { suppliers, addSupplier, setSuppliers } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Selected supplier for edit/delete
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: ""
  })
  
  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: ""
  })

  // ✅ Fetch suppliers from API on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true)
      try {
        const data = await suppliersService.getAll()
        setSuppliers(data)
      } catch (error) {
        console.error('Failed to fetch suppliers:', error)
        toast.error('Failed to load suppliers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuppliers()
  }, [setSuppliers])

  // ✅ Handle Add Supplier
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addForm.name || !addForm.contact || !addForm.phone) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const newSupplier = await suppliersService.create({
        ...addForm,
        productsSupplied: 0
      })
      
      // Update local state
      await addSupplier(newSupplier)
      
      toast.success(`${addForm.name} added successfully`)
      setAddForm({ name: "", contact: "", phone: "", email: "" })
      setAddDialogOpen(false)
      
      // Refresh the suppliers list
      const updatedSuppliers = await suppliersService.getAll()
      setSuppliers(updatedSuppliers)
    } catch (error) {
      console.error('Failed to add supplier:', error)
      toast.error('Failed to add supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Handle Edit Button Click
  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditForm({
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email || ""
    })
    setEditDialogOpen(true)
  }

  // ✅ Handle Update Supplier
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editForm.name || !editForm.contact || !editForm.phone) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!selectedSupplier) return

    setIsSubmitting(true)
    try {
      const updatedSupplier = await suppliersService.update(selectedSupplier.id, {
        ...editForm,
        productsSupplied: selectedSupplier.productsSupplied || 0
      })
      
      // Update local state
      // await updateSupplier(updatedSupplier)
      
      toast.success(`${editForm.name} updated successfully`)
      setEditDialogOpen(false)
      setSelectedSupplier(null)
      
      // Refresh the suppliers list
      const updatedSuppliers = await suppliersService.getAll()
      setSuppliers(updatedSuppliers)
    } catch (error) {
      console.error('Failed to update supplier:', error)
      toast.error('Failed to update supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Handle Delete Button Click
  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setDeleteDialogOpen(true)
  }

  // ✅ Handle Delete Supplier
  const handleDelete = async () => {
    if (!selectedSupplier) return

    setIsDeleting(true)
    try {
      await suppliersService.delete(selectedSupplier.id)
      
      // Update local state
      // await deleteSupplier(selectedSupplier.id)
      
      toast.success(`${selectedSupplier.name} deleted successfully`)
      setDeleteDialogOpen(false)
      setSelectedSupplier(null)
      
      // Refresh the suppliers list
      const updatedSuppliers = await suppliersService.getAll()
      setSuppliers(updatedSuppliers)
    } catch (error) {
      console.error('Failed to delete supplier:', error)
      toast.error('Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader title="Suppliers" description="Manage supplier records and contacts" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading suppliers...</p>
          </div>
        </div>
      </>
    )
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
                  {suppliers.reduce((sum, s) => sum + (s.productsSupplied || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Products supplied</p>
              </div>
            </CardContent>
          </Card>
          <Card className="flex items-center justify-center p-5">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="size-4 mr-2" /> Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Supplier</DialogTitle>
                  <DialogDescription>Record a new beer supplier or distributor.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s-name">Company name *</Label>
                    <Input
                      id="s-name"
                      value={addForm.name}
                      autoComplete="off"
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      required
                      placeholder="e.g., Beer Distributors Ltd"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s-contact">Contact person *</Label>
                    <Input
                      id="s-contact"
                      value={addForm.contact}
                      autoComplete="off"
                      onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                      required
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="s-phone">Phone *</Label>
                      <Input
                        id="s-phone"
                        value={addForm.phone}
                        autoComplete="off"
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        required
                        placeholder="+250 788 123 456"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="s-email">Email</Label>
                      <Input
                        id="s-email"
                        type="email"
                        value={addForm.email}
                        autoComplete="off"
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="supplier@example.com"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Supplier'
                      )}
                    </Button>
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
                    <TableHead className="text-right">Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right text-muted-foreground">
                        {s.createdAt ? formatDate(s.createdAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(s)}
                          >
                            <Edit2 className="size-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteClick(s)}
                          >
                            <Trash2 className="size-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Truck className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No suppliers found</p>
                        <Button 
                          variant="link" 
                          onClick={() => setAddDialogOpen(true)}
                          className="mt-2"
                        >
                          Add your first supplier
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Edit Supplier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="e-name">Company name *</Label>
              <Input
                id="e-name"
                value={editForm.name}
                autoComplete="off"
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                placeholder="e.g., Beer Distributors Ltd"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="e-contact">Contact person *</Label>
              <Input
                id="e-contact"
                value={editForm.contact}
                autoComplete="off"
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                required
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-phone">Phone *</Label>
                <Input
                  id="e-phone"
                  value={editForm.phone}
                  autoComplete="off"
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                  placeholder="+250 788 123 456"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-email">Email</Label>
                <Input
                  id="e-email"
                  type="email"
                  value={editForm.email}
                  autoComplete="off"
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="supplier@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedSupplier(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Supplier'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Supplier Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="p-3 bg-muted dark:bg-muted/50 rounded-lg space-y-1 text-sm">
                <div><span className="font-medium">Company:</span> {selectedSupplier.name}</div>
                <div><span className="font-medium">Contact:</span> {selectedSupplier.contact}</div>
                <div><span className="font-medium">Phone:</span> {selectedSupplier.phone}</div>
                {selectedSupplier.email && (
                  <div><span className="font-medium">Email:</span> {selectedSupplier.email}</div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setSelectedSupplier(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4 mr-2" />
                      Delete Supplier
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}