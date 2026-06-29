"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  ArrowLeft, RefreshCw, CheckCircle, Clock, AlertCircle, Package, Undo2, Plus, 
  Download, FileText, TrendingUp, AlertTriangle, DollarSign, Users, Truck, 
  Wrench, Calendar, Search, Filter, MoreHorizontal, Eye, Edit2, Trash2, X,
  BarChart3, PieChart
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"
import type { EmptyCaseTransaction, SupplierReturn, DamagedCase, EmptyCaseStatus, TransactionType } from "@/lib/types"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { emptyCaseTransactionsService } from "@/services"

// ============================================
// FORM COMPONENTS
// ============================================

function EmptyCaseTransactionForm({ 
  products, 
  customers, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  products: any[], 
  customers: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [transactionType, setTransactionType] = useState<TransactionType>("sale")
  const [expectedReturnDate, setExpectedReturnDate] = useState("")
  const [notes, setNotes] = useState("")

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Transaction Type</Label>
          <Select value={transactionType} onValueChange={(v: TransactionType) => setTransactionType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="customer_return">Customer Return</SelectItem>
              <SelectItem value="supplier_return">Supplier Return</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - Deposit: {formatCurrency(product.depositAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {transactionType === "sale" && (
        <div className="space-y-2">
          <Label>Customer</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Expected Return Date</Label>
          <Input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>
      </div>

      {selectedProductData && (
        <div className="p-3 bg-muted rounded-lg dark:bg-muted/50">
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Deposit per case:</span> {formatCurrency(selectedProductData.depositAmount)}</div>
            <div><span className="font-medium">Total deposit value:</span> {formatCurrency(quantity * selectedProductData.depositAmount)}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          productId: selectedProduct,
          customerId: selectedCustomer,
          customerName: selectedCustomerData?.name,
          transactionType,
          totalQuantity: quantity,
          depositAmount: selectedProductData?.depositAmount || 0,
          totalDepositValue: quantity * (selectedProductData?.depositAmount || 0),
          expectedReturnDate: expectedReturnDate || undefined,
          notes,
          createdBy: currentUser?.name || "System",
        })}>
          Create Transaction
        </Button>
      </div>
    </div>
  )
}

function SupplierReturnForm({ 
  suppliers, 
  products, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  suppliers: any[], 
  products: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [notes, setNotes] = useState("")

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier)
  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Receipt Number</Label>
          <Input
            placeholder="SUP-2024-XXX"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          supplierId: selectedSupplier,
          supplierName: selectedSupplierData?.name,
          productId: selectedProduct,
          productName: selectedProductData?.name,
          quantity,
          receiptNumber: receiptNumber || `SUP-${Date.now()}`,
          returnedDate: new Date().toISOString(),
          receivedBy: currentUser?.name || "System",
          notes,
        })}>
          Record Return
        </Button>
      </div>
    </div>
  )
}

function DamagedCaseForm({ 
  products, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  products: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [damageCost, setDamageCost] = useState(0)
  const [notes, setNotes] = useState("")

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Damage Cost</Label>
          <Input
            type="number"
            min="0"
            value={damageCost}
            onChange={(e) => setDamageCost(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Broken during handling">Broken during handling</SelectItem>
            <SelectItem value="Water damage">Water damage</SelectItem>
            <SelectItem value="Transport damage">Transport damage</SelectItem>
            <SelectItem value="Storage damage">Storage damage</SelectItem>
            <SelectItem value="Customer damage">Customer damage</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          productId: selectedProduct,
          productName: selectedProductData?.name,
          quantity,
          reason,
          damageCost,
          reportedDate: new Date().toISOString(),
          reportedBy: currentUser?.name || "System",
          notes,
        })}>
          Report Damage
        </Button>
      </div>
    </div>
  )
}

function ProcessReturnForm({ 
  transaction, 
  onSubmit, 
  onCancel,
}: { 
  transaction: EmptyCaseTransaction, 
  onSubmit: (quantity: number) => void, 
  onCancel: () => void,
}) {
  const [returnQuantity, setReturnQuantity] = useState(transaction.pendingQuantity)

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg dark:bg-muted/50 space-y-2 text-sm">
        <div><span className="font-medium">Total cases:</span> {transaction.totalQuantity}</div>
        <div><span className="font-medium">Already returned:</span> {transaction.returnedQuantity}</div>
        <div><span className="font-medium">Pending:</span> {transaction.pendingQuantity}</div>
        <div><span className="font-medium">Deposit per case:</span> {formatCurrency(transaction.depositAmount)}</div>
        <div><span className="font-medium">Refund amount:</span> {formatCurrency(returnQuantity * transaction.depositAmount)}</div>
      </div>

      <div className="space-y-2">
        <Label>Return Quantity</Label>
        <Input
          type="number"
          min="1"
          max={transaction.pendingQuantity}
          value={returnQuantity}
          onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(returnQuantity)}>
          Process Return
        </Button>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmptyCasesPage() {
  const { 
    currentUser, 
    products, 
    customers, 
    suppliers, 
    emptyCaseTransactions, 
    supplierReturns, 
    damagedCases,
    addEmptyCaseTransaction,
    processEmptyCaseReturn,
    addSupplierReturn,
    addDamagedCase,
    checkAndGenerateNotifications,
    setEmptyCaseTransactions,
  } = useApp()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ FIX: Store the function in a ref so it's never a useEffect dependency
  const checkNotificationsRef = useRef(checkAndGenerateNotifications)
  useEffect(() => {
    checkNotificationsRef.current = checkAndGenerateNotifications
  })

  // ✅ Load data from API on mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await emptyCaseTransactionsService.getAll()
        // Update the store with API data
        setEmptyCaseTransactions(data)
      } catch (err) {
        console.error('Failed to load empty case transactions:', err)
        setError('Failed to load transactions from server')
        toast.error('Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
    checkNotificationsRef.current?.()
  }, [setEmptyCaseTransactions]) // ✅ Only depends on setEmptyCaseTransactions

  // ✅ Override addEmptyCaseTransaction to use API
  const handleAddTransaction = async (data: any) => {
    setIsLoading(true)
    try {
      const newTransaction = await emptyCaseTransactionsService.create({
        productId: data.productId,
        customerId: data.customerId,
        customerName: data.customerName,
        transactionType: data.transactionType,
        totalQuantity: data.totalQuantity,
        depositAmount: data.depositAmount,
        expectedReturnDate: data.expectedReturnDate,
        notes: data.notes,
        createdBy: data.createdBy,
      })
      
      // Update local store
      addEmptyCaseTransaction(newTransaction)
      toast.success('Transaction created successfully')
      return newTransaction
    } catch (err) {
      console.error('Failed to create transaction:', err)
      toast.error('Failed to create transaction')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Override processReturn to use API
  const handleProcessReturn = async (transactionId: string, returnQuantity: number) => {
    setIsLoading(true)
    try {
      const updatedTransaction = await emptyCaseTransactionsService.processReturn(transactionId, {
        returnQuantity,
        processedBy: currentUser?.name || 'System',
      })
      
      // Update local store - this will also refresh customers via the store method
      await processEmptyCaseReturn(transactionId, returnQuantity, currentUser?.name || 'System')
      toast.success(`Processed ${returnQuantity} case return(s)`)
      return updatedTransaction
    } catch (err) {
      console.error('Failed to process return:', err)
      toast.error('Failed to process return')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<EmptyCaseStatus | "all">("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "all">("all")
  const [activeTab, setActiveTab] = useState("transactions")
  
  // Dialog states
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [supplierReturnOpen, setSupplierReturnOpen] = useState(false)
  const [damagedCaseOpen, setDamagedCaseOpen] = useState(false)
  const [processReturnOpen, setProcessReturnOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<EmptyCaseTransaction | null>(null)

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return emptyCaseTransactions.filter(t => {
      const product = products.find(p => p.id === t.productId)
      const matchQuery = product?.name.toLowerCase().includes(query.toLowerCase()) ||
                        product?.brand.toLowerCase().includes(query.toLowerCase()) ||
                        t.customerName?.toLowerCase().includes(query.toLowerCase())
      
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      const matchType = transactionTypeFilter === "all" || t.transactionType === transactionTypeFilter
      
      return matchQuery && matchStatus && matchType
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [emptyCaseTransactions, products, query, statusFilter, transactionTypeFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTransactions = emptyCaseTransactions.length
    const totalPending = emptyCaseTransactions.reduce((sum, t) => sum + t.pendingQuantity, 0)
    const totalReturned = emptyCaseTransactions.reduce((sum, t) => sum + t.returnedQuantity, 0)
    const pendingValue = emptyCaseTransactions.reduce((sum, t) => sum + (t.pendingQuantity * t.depositAmount), 0)
    const refundedValue = emptyCaseTransactions.reduce((sum, t) => sum + t.refundedAmount, 0)
    const overdueCount = emptyCaseTransactions.filter(t => t.status === "overdue").length
    const damagedCount = damagedCases.reduce((sum, d) => sum + d.quantity, 0)
    const supplierReturnCount = supplierReturns.reduce((sum, s) => sum + s.quantity, 0)
    
    return { 
      totalTransactions, 
      totalPending, 
      totalReturned, 
      pendingValue, 
      refundedValue, 
      overdueCount, 
      damagedCount,
      supplierReturnCount,
    }
  }, [emptyCaseTransactions, damagedCases, supplierReturns])

  // Status badge helper with dark mode support
  const getStatusBadge = (status: EmptyCaseStatus) => {
    const statusConfig = {
      pending: { 
        label: "Pending", 
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" 
      },
      partial: { 
        label: "Partial", 
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
      },
      completed: { 
        label: "Completed", 
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
      },
      overdue: { 
        label: "Overdue", 
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
      },
      damaged: { 
        label: "Damaged", 
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" 
      },
      cancelled: { 
        label: "Cancelled", 
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400" 
      },
    }
    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // Handle process return with API
  const handleProcessReturnClick = async (returnQuantity: number) => {
    if (!selectedTransaction || !currentUser) return
    try {
      await handleProcessReturn(selectedTransaction.id, returnQuantity)
      setProcessReturnOpen(false)
      setSelectedTransaction(null)
    } catch (error) {
      // Error already handled in handleProcessReturn
    }
  }

  // Export functionality
  const handleExport = (format: "csv" | "excel") => {
    const data = filteredTransactions.map(t => {
      const product = products.find(p => p.id === t.productId)
      return {
        Product: product?.name || "Unknown",
        Customer: t.customerName || "-",
        Type: t.transactionType,
        Total: t.totalQuantity,
        Returned: t.returnedQuantity,
        Pending: t.pendingQuantity,
        Status: t.status,
        "Deposit Value": formatCurrency(t.totalDepositValue),
        "Refunded": formatCurrency(t.refundedAmount),
        Date: formatDate(t.createdAt),
      }
    })

    if (format === "csv") {
      const headers = Object.keys(data[0]).join(",")
      const rows = data.map(row => Object.values(row).join(","))
      const csv = [headers, ...rows].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `empty-cases-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV exported successfully")
    }
  }

  // Chart colors that work in both light and dark mode
  const chartColors = {
    returned: "#10b981",
    pending: "#f59e0b",
    overdue: "#ef4444",
    completed: "#22c55e",
    partial: "#3b82f6",
  }

  // Show loading state
  if (isLoading && emptyCaseTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4 md:p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empty Cases Management</h1>
            <p className="text-muted-foreground">Track empty bottles, deposits, returns, and supplier collections</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="size-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{stats.totalTransactions}</p>
              </div>
              <Package className="size-6 text-blue-500 dark:text-blue-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Cases</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalPending}</p>
              </div>
              <Clock className="size-6 text-yellow-500 dark:text-yellow-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Returned Cases</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.totalReturned}</p>
              </div>
              <CheckCircle className="size-6 text-green-500 dark:text-green-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Value</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.pendingValue)}</p>
              </div>
              <DollarSign className="size-6 text-purple-500 dark:text-purple-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Refunded</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.refundedValue)}</p>
              </div>
              <RefreshCw className="size-6 text-emerald-500 dark:text-emerald-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.overdueCount}</p>
              </div>
              <AlertTriangle className="size-6 text-red-500 dark:text-red-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Damaged</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.damagedCount}</p>
              </div>
              <Wrench className="size-6 text-orange-500 dark:text-orange-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Supplier Returns</p>
                <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{stats.supplierReturnCount}</p>
              </div>
              <Truck className="size-6 text-cyan-500 dark:text-cyan-400" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="supplier-returns">Supplier Returns</TabsTrigger>
              <TabsTrigger value="damaged">Damaged Cases</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="size-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {activeTab === "transactions" && (
                <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4 mr-2" />
                      New Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Empty Case Transaction</DialogTitle>
                      <DialogDescription>
                        Record a new empty case transaction
                      </DialogDescription>
                    </DialogHeader>
                    <EmptyCaseTransactionForm 
                      products={products}
                      customers={customers}
                      currentUser={currentUser}
                      onSubmit={async (data) => {
                        try {
                          await handleAddTransaction(data)
                          setAddTransactionOpen(false)
                        } catch (error) {
                          // Error already handled in handleAddTransaction
                        }
                      }}
                      onCancel={() => setAddTransactionOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {activeTab === "supplier-returns" && (
                <Dialog open={supplierReturnOpen} onOpenChange={setSupplierReturnOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4 mr-2" />
                      Supplier Return
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Record Supplier Return</DialogTitle>
                      <DialogDescription>
                        Return empty cases to supplier
                      </DialogDescription>
                    </DialogHeader>
                    <SupplierReturnForm 
                      suppliers={suppliers}
                      products={products}
                      currentUser={currentUser}
                      onSubmit={(data) => {
                        addSupplierReturn(data)
                        setSupplierReturnOpen(false)
                        toast.success("Supplier return recorded")
                      }}
                      onCancel={() => setSupplierReturnOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {activeTab === "damaged" && (
                <Dialog open={damagedCaseOpen} onOpenChange={setDamagedCaseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4 mr-2" />
                      Report Damage
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Report Damaged Cases</DialogTitle>
                      <DialogDescription>
                        Record damaged empty cases
                      </DialogDescription>
                    </DialogHeader>
                    <DamagedCaseForm 
                      products={products}
                      currentUser={currentUser}
                      onSubmit={(data) => {
                        addDamagedCase(data)
                        setDamagedCaseOpen(false)
                        toast.success("Damage reported")
                      }}
                      onCancel={() => setDamagedCaseOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product or customer..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: EmptyCaseStatus | "all") => setStatusFilter(v)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={transactionTypeFilter} onValueChange={(v: TransactionType | "all") => setTransactionTypeFilter(v)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="customer_return">Customer Return</SelectItem>
                    <SelectItem value="supplier_return">Supplier Return</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Returned</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deposit Value</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => {
                      const product = products.find(p => p.id === t.productId)
                      return (
                        <TableRow 
                          key={t.id} 
                          className={t.pendingQuantity > 0 ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{product?.name || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground">{product?.brand}</span>
                            </div>
                          </TableCell>
                          <TableCell>{t.customerName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:border-gray-700">
                              {t.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{t.totalQuantity}</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                            {t.returnedQuantity}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600 dark:text-yellow-400 font-medium">
                            {t.pendingQuantity}
                          </TableCell>
                          <TableCell>{getStatusBadge(t.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatCurrency(t.totalDepositValue)}</span>
                              <span className="text-xs text-muted-foreground">
                                Refunded: {formatCurrency(t.refundedAmount)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.expectedReturnDate ? formatDate(t.expectedReturnDate) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {t.pendingQuantity > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(t)
                                  setProcessReturnOpen(true)
                                }}
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                disabled={isLoading}
                              >
                                <CheckCircle className="size-4 mr-1" />
                                Return
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-12 text-center">
                          <Package className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No transactions found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Return Trends Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-5" />
                  Return Trends (Last 7 Days)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emptyCaseTransactions.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis 
                      dataKey="createdAt" 
                      tickFormatter={(value) => formatDate(value).split(',')[0]}
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value: number) => [value, "Cases"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="returnedQuantity" stroke={chartColors.returned} name="Returned" strokeWidth={2} />
                    <Line type="monotone" dataKey="pendingQuantity" stroke={chartColors.pending} name="Pending" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Status Distribution Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="size-5" />
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: emptyCaseTransactions.filter(t => t.status === "pending").length, color: chartColors.pending },
                        { name: "Partial", value: emptyCaseTransactions.filter(t => t.status === "partial").length, color: chartColors.partial },
                        { name: "Completed", value: emptyCaseTransactions.filter(t => t.status === "completed").length, color: chartColors.completed },
                        { name: "Overdue", value: emptyCaseTransactions.filter(t => t.status === "overdue").length, color: chartColors.overdue },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { color: chartColors.pending },
                        { color: chartColors.partial },
                        { color: chartColors.completed },
                        { color: chartColors.overdue },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Card>

              {/* Product Performance Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  Cases by Product
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={products.map(p => ({
                    name: p.name,
                    pending: emptyCaseTransactions.filter(t => t.productId === p.id).reduce((sum, t) => sum + t.pendingQuantity, 0),
                    returned: emptyCaseTransactions.filter(t => t.productId === p.id).reduce((sum, t) => sum + t.returnedQuantity, 0),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pending" fill={chartColors.pending} name="Pending" />
                    <Bar dataKey="returned" fill={chartColors.returned} name="Returned" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Deposit Value Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="size-5" />
                  Deposit Value by Status
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Pending", value: stats.pendingValue },
                    { name: "Refunded", value: stats.refundedValue },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8b5cf6" name="Value" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Return Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalReturned > 0 ? ((stats.totalReturned / (stats.totalReturned + stats.totalPending)) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Return Time</p>
                    <p className="text-2xl font-bold">5.2d</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalTransactions > 0 ? ((stats.overdueCount / stats.totalTransactions) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Wrench className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Damage Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalTransactions > 0 ? ((stats.damagedCount / stats.totalTransactions) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Supplier Returns Tab */}
          <TabsContent value="supplier-returns" className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Receipt Number</TableHead>
                      <TableHead>Returned Date</TableHead>
                      <TableHead>Received By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierReturns.map((sr) => (
                      <TableRow key={sr.id}>
                        <TableCell className="font-medium">{sr.supplierName}</TableCell>
                        <TableCell>{sr.productName}</TableCell>
                        <TableCell className="text-right font-medium">{sr.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs dark:border-gray-700">
                            {sr.receiptNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sr.returnedDate)}</TableCell>
                        <TableCell>{sr.receivedBy}</TableCell>
                      </TableRow>
                    ))}
                    {supplierReturns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Truck className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No supplier returns recorded</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Damaged Cases Tab */}
          <TabsContent value="damaged" className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-800">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Damage Cost</TableHead>
                      <TableHead>Reported Date</TableHead>
                      <TableHead>Reported By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {damagedCases.map((dc) => (
                      <TableRow key={dc.id}>
                        <TableCell className="font-medium">{dc.productName}</TableCell>
                        <TableCell className="text-right font-medium">{dc.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="dark:border-gray-700">
                            {dc.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(dc.damageCost)}
                        </TableCell>
                        <TableCell>{formatDate(dc.reportedDate)}</TableCell>
                        <TableCell>{dc.reportedBy}</TableCell>
                      </TableRow>
                    ))}
                    {damagedCases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Wrench className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No damaged cases reported</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Audit log functionality - Track all transaction changes</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Process Return Dialog */}
      <Dialog open={processReturnOpen} onOpenChange={setProcessReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Empty Case Return</DialogTitle>
            <DialogDescription>
              Process return for pending empty cases
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <ProcessReturnForm 
              transaction={selectedTransaction}
              onSubmit={handleProcessReturnClick}
              onCancel={() => {
                setProcessReturnOpen(false)
                setSelectedTransaction(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}