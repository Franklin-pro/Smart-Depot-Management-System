"use client"

import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  Receipt, Search, Download, Printer, Eye, 
  DollarSign, Package, Users, Calendar, Filter,
  FileText, FileSpreadsheet, FileJson, Plus,
  ChevronRight, Clock, CheckCircle, XCircle,
  CreditCard, Truck, Building, AlertCircle,
  RefreshCw, Trash2, Mail, Phone, MapPin
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/dialog"

// Types
type ReceiptType = "sale" | "expense" | "empty_case" | "supplier_return"

interface ReceiptRecord {
  id: string
  receiptNumber: string
  type: ReceiptType
  title: string
  description: string
  amount: number
  date: string
  customerName?: string
  customerPhone?: string
  supplierName?: string
  paymentMethod: string
  status: "completed" | "pending" | "cancelled"
  items?: any[]
  createdBy: string
  createdAt: string
  metadata?: Record<string, any>
}

// Helper function to safely get ID string
const safeId = (id: any): string => {
  if (!id) return String(Date.now())
  if (typeof id === 'string') return id
  if (typeof id === 'number') return String(id)
  return String(id)
}

// Helper function to safely slice ID
const safeSlice = (id: any, length: number = 8): string => {
  const idStr = safeId(id)
  return idStr.slice(-length)
}

// Receipt Modal Component
function ReceiptViewModal({ receipt, onClose }: { receipt: ReceiptRecord | null; onClose: () => void }) {
  if (!receipt) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={!!receipt} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
          <DialogDescription>{receipt.receiptNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4" id="receipt-content">
          {/* Header */}
          <div className="text-center">
            <h3 className="font-bold text-xl">Beer Depot</h3>
            <p className="text-xs text-muted-foreground">123 Main Street, Kigali</p>
            <p className="text-xs text-muted-foreground">Tel: +250 788 123 456</p>
            <p className="text-xs text-muted-foreground">Email: info@beerdepot.com</p>
          </div>

          <Separator />

          {/* Receipt Info */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt Number:</span>
              <span className="font-mono font-medium">{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(receipt.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="capitalize">
                {receipt.type?.replace('_', ' ') || receipt.type}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Party Information */}
          {(receipt.customerName || receipt.supplierName) && (
            <>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Party Information</h4>
                {receipt.customerName && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{receipt.customerName}</span>
                    </div>
                    {receipt.customerPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{receipt.customerPhone}</span>
                      </div>
                    )}
                  </>
                )}
                {receipt.supplierName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{receipt.supplierName}</span>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Items Table */}
          {receipt.items && receipt.items.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold text-sm mb-2">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{item.name || item.productName || item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity || 1}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice || item.price || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total || item.subtotal || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Separator />
            </>
          )}

          {/* Amount Details */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Description:</span>
              <span className="text-right">{receipt.description}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total Amount:</span>
              <span>{formatCurrency(receipt.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="capitalize">{receipt.paymentMethod?.replace('_', ' ') || receipt.paymentMethod || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span>
                {receipt.status === "completed" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>
                ) : receipt.status === "pending" ? (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
                ) : (
                  <Badge variant="destructive">Cancelled</Badge>
                )}
              </span>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">Generated on {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4 mr-2" />
            Print
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Receipt Form Component
function ReceiptForm({ 
  onSubmit, 
  onCancel,
  type,
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  type: ReceiptType
}) {
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    customerName: "",
    customerPhone: "",
    supplierName: "",
    paymentMethod: "cash",
    notes: "",
  })

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Description *</Label>
        <Input
          placeholder="Enter description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input
          type="number"
          min="0"
          placeholder="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {type === "sale" && (
        <>
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input
              placeholder="Customer name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Customer Phone</Label>
            <Input
              placeholder="Customer phone"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>
        </>
      )}

      {(type === "expense" || type === "supplier_return") && (
        <div className="space-y-2">
          <Label>Supplier Name</Label>
          <Input
            placeholder="Supplier name"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Additional notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          Generate Receipt
        </Button>
      </div>
    </div>
  )
}

export default function ReceiptsPage() {
  const { 
    currentUser,
    sales = [], 
    expenses = [],
    emptyCaseTransactions = [],
    supplierReturns = []
  } = useApp()

  const [receipts, setReceipts] = useState<ReceiptRecord[]>([])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ReceiptType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "cancelled">("all")
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "all">("month")
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateType, setGenerateType] = useState<ReceiptType>("sale")

  // Generate receipts from sales, expenses, etc.
  const generateReceipts = () => {
    const allReceipts: ReceiptRecord[] = []

    // Generate sale receipts
    if (sales && Array.isArray(sales)) {
      sales.forEach((sale: any) => {
        if (sale && sale.status === "completed") {
          allReceipts.push({
            id: `receipt_sale_${safeId(sale.id)}`,
            receiptNumber: `RCP-${sale.invoiceNumber || safeSlice(sale.id, 8) || String(Date.now()).slice(-8)}`,
            type: "sale",
            title: "Sale Receipt",
            description: `Sale of ${sale.items?.length || 0} item(s)`,
            amount: sale.total || 0,
            date: sale.createdAt || new Date().toISOString(),
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            paymentMethod: sale.paymentMethod || "cash",
            status: "completed",
            items: sale.items?.map((item: any) => ({
              name: item.product?.name || item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.subtotal,
            })),
            createdBy: sale.createdBy || "System",
            createdAt: sale.createdAt || new Date().toISOString(),
          })
        }
      })
    }

    // Generate expense receipts
    if (expenses && Array.isArray(expenses)) {
      expenses.forEach((expense: any) => {
        if (expense) {
          allReceipts.push({
            id: `receipt_expense_${safeId(expense.id)}`,
            receiptNumber: `EXP-${expense.expenseNumber || safeSlice(expense.id, 8) || String(Date.now()).slice(-8)}`,
            type: "expense",
            title: "Expense Receipt",
            description: expense.title || expense.description || "Expense",
            amount: expense.amount || 0,
            date: expense.date || new Date().toISOString(),
            supplierName: expense.supplierName,
            paymentMethod: expense.paymentMethod || "cash",
            status: expense.status === "paid" ? "completed" : "pending",
            items: expense.quantity ? [{
              name: expense.title || expense.description,
              quantity: expense.quantity,
              unitPrice: expense.unitPrice,
              total: expense.amount,
            }] : undefined,
            createdBy: expense.recordedBy || expense.createdBy || "System",
            createdAt: expense.createdAt || new Date().toISOString(),
          })
        }
      })
    }

    // Generate empty case receipts
    if (emptyCaseTransactions && Array.isArray(emptyCaseTransactions)) {
      emptyCaseTransactions.forEach((tx: any) => {
        if (tx) {
          allReceipts.push({
            id: `receipt_empty_${safeId(tx.id)}`,
            receiptNumber: `EMP-${safeSlice(tx.id, 8) || String(Date.now()).slice(-8)}`,
            type: "empty_case",
            title: "Empty Cases Deposit Receipt",
            description: `${tx.totalQuantity || 0} empty case(s) deposit for ${tx.productName || "Unknown"}`,
            amount: tx.totalDepositValue || 0,
            date: tx.createdAt || new Date().toISOString(),
            customerName: tx.customerName,
            paymentMethod: "deposit",
            status: tx.status === "completed" ? "completed" : "pending",
            items: [{
              name: tx.productName,
              quantity: tx.totalQuantity,
              unitPrice: tx.depositAmount,
              total: tx.totalDepositValue,
            }],
            createdBy: tx.createdBy || "System",
            createdAt: tx.createdAt || new Date().toISOString(),
            metadata: { pendingQuantity: tx.pendingQuantity, returnedQuantity: tx.returnedQuantity }
          })
        }
      })
    }

    // Generate supplier return receipts
    if (supplierReturns && Array.isArray(supplierReturns)) {
      supplierReturns.forEach((ret: any) => {
        if (ret) {
          allReceipts.push({
            id: `receipt_return_${safeId(ret.id)}`,
            receiptNumber: `RET-${ret.receiptNumber || safeSlice(ret.id, 8) || String(Date.now()).slice(-8)}`,
            type: "supplier_return",
            title: "Supplier Return Receipt",
            description: `Return of ${ret.quantity || 0} cases to supplier`,
            amount: ret.totalDepositValue || 0,
            date: ret.returnedDate || new Date().toISOString(),
            supplierName: ret.supplierName,
            paymentMethod: "return",
            status: "completed",
            items: [{
              name: ret.productName,
              quantity: ret.quantity,
              unitPrice: ret.depositAmount,
              total: ret.totalDepositValue,
            }],
            createdBy: ret.receivedBy || "System",
            createdAt: ret.returnedDate || new Date().toISOString(),
          })
        }
      })
    }

    setReceipts(allReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  // Initial load - use useEffect
  useEffect(() => {
    generateReceipts()
  }, [sales, expenses, emptyCaseTransactions, supplierReturns])

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    let filtered = receipts

    if (query) {
      filtered = filtered.filter(r =>
        r.receiptNumber?.toLowerCase().includes(query.toLowerCase()) ||
        r.description?.toLowerCase().includes(query.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(query.toLowerCase()) ||
        r.supplierName?.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(r => r.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (dateRange === "today") {
      filtered = filtered.filter(r => new Date(r.date) >= today)
    } else if (dateRange === "week") {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(r => new Date(r.date) >= weekAgo)
    } else if (dateRange === "month") {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(r => new Date(r.date) >= monthAgo)
    } else if (dateRange === "year") {
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      filtered = filtered.filter(r => new Date(r.date) >= yearAgo)
    }

    return filtered
  }, [receipts, query, typeFilter, statusFilter, dateRange])

  // Statistics
  const stats = useMemo(() => {
    const totalReceipts = filteredReceipts.length
    const totalAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0)
    const saleReceipts = filteredReceipts.filter(r => r.type === "sale").length
    const expenseReceipts = filteredReceipts.filter(r => r.type === "expense").length
    const emptyCaseReceipts = filteredReceipts.filter(r => r.type === "empty_case").length
    
    const saleTotal = filteredReceipts.filter(r => r.type === "sale").reduce((sum, r) => sum + (r.amount || 0), 0)
    const expenseTotal = filteredReceipts.filter(r => r.type === "expense").reduce((sum, r) => sum + (r.amount || 0), 0)

    return {
      totalReceipts,
      totalAmount,
      saleReceipts,
      expenseReceipts,
      emptyCaseReceipts,
      saleTotal,
      expenseTotal,
    }
  }, [filteredReceipts])

  // Get type badge
  const getTypeBadge = (type: ReceiptType) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Sale</Badge>
      case "expense":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expense</Badge>
      case "empty_case":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Empty Case</Badge>
      case "supplier_return":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Supplier Return</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Generate new receipt
  const handleGenerateReceipt = (data: any) => {
    const newReceipt: ReceiptRecord = {
      id: `receipt_manual_${Date.now()}`,
      receiptNumber: `MAN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(receipts.length + 1).padStart(4, '0')}`,
      type: generateType,
      title: `${generateType.replace('_', ' ')} Receipt`,
      description: data.description,
      amount: data.amount,
      date: new Date().toISOString(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      supplierName: data.supplierName,
      paymentMethod: data.paymentMethod,
      status: "completed",
      createdBy: currentUser?.name || "System",
      createdAt: new Date().toISOString(),
    }
    
    setReceipts([newReceipt, ...receipts])
    setGenerateOpen(false)
    toast.success("Receipt generated successfully")
  }

  // Export CSV
  const handleExport = () => {
    if (filteredReceipts.length === 0) {
      toast.error("No receipts to export")
      return
    }
    
    const data = filteredReceipts.map(r => ({
      "Receipt Number": r.receiptNumber,
      "Type": r.type,
      "Description": r.description,
      "Amount": formatCurrency(r.amount || 0),
      "Date": formatDate(r.date),
      "Customer/Supplier": r.customerName || r.supplierName || "-",
      "Payment Method": r.paymentMethod || "N/A",
      "Status": r.status,
      "Created By": r.createdBy,
    }))

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipts-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Receipts exported")
  }

  // Refresh receipts
  const handleRefresh = () => {
    generateReceipts()
    toast.success("Receipts refreshed")
  }

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    if (!method) return "N/A"
    return method.replace(/_/g, ' ')
  }

  return (
    <>
      <DashboardHeader 
        title="Receipts Management" 
        description="View and manage all transaction receipts"
      />

      <div className="flex justify-end gap-2 px-4 md:px-6 pt-2">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="size-4 mr-2" />
          Generate Receipt
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{stats.totalReceipts}</p>
              </div>
              <Receipt className="size-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="size-6 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sale Receipts</p>
                <p className="text-2xl font-bold">{stats.saleReceipts}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.saleTotal)}</p>
              </div>
              <CreditCard className="size-6 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expense Receipts</p>
                <p className="text-2xl font-bold">{stats.expenseReceipts}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.expenseTotal)}</p>
              </div>
              <FileText className="size-6 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search receipts..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Receipt type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sale Receipts</SelectItem>
                <SelectItem value="expense">Expense Receipts</SelectItem>
                <SelectItem value="empty_case">Empty Case Receipts</SelectItem>
                <SelectItem value="supplier_return">Supplier Returns</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Receipts Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Customer/Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-sm">{receipt.receiptNumber}</TableCell>
                    <TableCell>{getTypeBadge(receipt.type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{receipt.description}</TableCell>
                    <TableCell>{receipt.customerName || receipt.supplierName || "-"}</TableCell>
                    <TableCell>{formatDate(receipt.date)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(receipt.amount || 0)}</TableCell>
                    <TableCell className="capitalize">{formatPaymentMethod(receipt.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReceipts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <Receipt className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No receipts found</p>
                      <Button 
                        variant="link" 
                        onClick={() => setGenerateOpen(true)}
                        className="mt-2"
                      >
                        Generate your first receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Generate Receipt Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
            <DialogDescription>Create a new manual receipt</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt Type</Label>
              <Select value={generateType} onValueChange={(v: ReceiptType) => setGenerateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale Receipt</SelectItem>
                  <SelectItem value="expense">Expense Receipt</SelectItem>
                  <SelectItem value="empty_case">Empty Case Receipt</SelectItem>
                  <SelectItem value="supplier_return">Supplier Return Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ReceiptForm 
              type={generateType}
              onSubmit={handleGenerateReceipt}
              onCancel={() => setGenerateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Receipt Modal */}
      <ReceiptViewModal 
        receipt={selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
      />
    </>
  )
}