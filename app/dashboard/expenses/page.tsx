"use client"

import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  DollarSign, Plus, Search, Download, FileText, 
  Printer, Trash2, Edit2, Eye, Calendar, 
  TrendingUp, Package, RefreshCw,
  CreditCard, Receipt, Building, Users, Truck,
  Coffee, Zap, Home, Shield, PenTool, AlertCircle,
  BarChart3, PieChart, Filter, ChevronRight,
  X, CheckCircle, Clock, MoreHorizontal,
  UploadCloud
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { expensesService } from "@/services"
import Link from "next/link"

// Types
type ExpenseCategory = 
  | "supplier"
  | "salary"
  | "rent"
  | "utilities"
  | "marketing"
  | "maintenance"
  | "transport"
  | "tax"
  | "insurance"
  | "equipment"
  | "cleaning"
  | "stationery"
  | "software"
  | "other"

type PaymentMethod = "cash" | "bank_transfer" | "mobile_money" | "cheque"

type ExpenseStatus = "paid" | "pending" | "cancelled"

interface Expense {
  id: string
  expenseNumber: string
  title: string
  recordedBy: string
  category: ExpenseCategory
  subcategory?: string
  description: string
  amount: number
  quantity?: number
  unitPrice?: number
  paymentMethod?: PaymentMethod
  status: ExpenseStatus
  date: string
  dueDate?: string
  paidDate?: string
  supplierId?: string
  supplierName?: string
  receiptNumber?: string
  invoiceNumber?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  attachments?: string[]
  receiptFileName?: string | null
  receiptUrl?: string | null
}

interface Budget {
  id: string
  category: ExpenseCategory
  month: string
  year: number
  allocatedAmount: number
  spentAmount: number
  notes?: string
}

// Helper function to clean number input
const cleanNumberInput = (value: string): string => {
  let cleaned = value.replace(/^0+(?=\d)/, '')
  cleaned = cleaned.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  return cleaned
}

// Helper function to format payment method safely
const formatPaymentMethod = (method?: string): string => {
  if (!method) return 'N/A'
  return method.replace('_', ' ')
}

// Form components
function ExpenseForm({ 
  onSubmit, 
  onCancel,
  initial,
  isLoading = false,
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  initial?: Expense
  isLoading?: boolean
}) {
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category || "other")
  const [title, setTitle] = useState(initial?.title || initial?.description || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [amount, setAmount] = useState(initial?.amount || 0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod || "cash")
  const [date, setDate] = useState(initial?.date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(initial?.dueDate?.split('T')[0] || "")
  const [supplierName, setSupplierName] = useState(initial?.supplierName || "")
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber || "")
  const [receiptNumber, setReceiptNumber] = useState(initial?.receiptNumber || "")
  const [notes, setNotes] = useState(initial?.notes || "")
  const [file, setFile] = useState<File | null>(null)
  const [quantity, setQuantity] = useState(initial?.quantity || 1)
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice || 0)
  const [dragActive, setDragActive] = useState(false)

  // Validation states
  const [errors, setErrors] = useState<{
    title?: string
    category?: string
    amount?: string
    date?: string
    paymentMethod?: string
    file?: string
  }>({})

  const categoryOptions: { value: ExpenseCategory; label: string; icon: any; color: string }[] = [
    { value: "supplier", label: "Supplier Payments", icon: Truck, color: "text-blue-500" },
    { value: "salary", label: "Salaries & Wages", icon: Users, color: "text-purple-500" },
    { value: "rent", label: "Rent / Lease", icon: Building, color: "text-emerald-500" },
    { value: "utilities", label: "Utilities", icon: Zap, color: "text-yellow-500" },
    { value: "marketing", label: "Marketing & Advertising", icon: TrendingUp, color: "text-pink-500" },
    { value: "maintenance", label: "Maintenance & Repairs", icon: PenTool, color: "text-orange-500" },
    { value: "transport", label: "Transport & Logistics", icon: Truck, color: "text-cyan-500" },
    { value: "tax", label: "Taxes & Licenses", icon: Shield, color: "text-gray-500" },
    { value: "insurance", label: "Insurance", icon: Shield, color: "text-teal-500" },
    { value: "equipment", label: "Equipment Purchase", icon: Package, color: "text-red-500" },
    { value: "cleaning", label: "Cleaning & Sanitation", icon: Coffee, color: "text-lime-500" },
    { value: "stationery", label: "Stationery & Printing", icon: FileText, color: "text-violet-500" },
    { value: "software", label: "Software & Subscriptions", icon: CreditCard, color: "text-green-500" },
    { value: "other", label: "Other Expenses", icon: DollarSign, color: "text-gray-400" },
  ]

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Validate Title
    if (!title || title.trim() === '') {
      newErrors.title = 'Title is required'
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }
    
    // Validate Category
    if (!category) {
      newErrors.category = 'Category is required'
    }
    
    // Validate Amount
    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    } else if (amount > 999999999) {
      newErrors.amount = 'Amount is too large'
    }
    
    // Validate Date
    if (!date) {
      newErrors.date = 'Date is required'
    } 
    
    // Validate Payment Method
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required'
    }
    
    // Validate File (optional - only if you want to require it)
    // Uncomment if you want to require a file
    // if (!file && !initial?.receiptUrl) {
    //   newErrors.file = 'Receipt is required'
    // }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Clear error for a specific field
  const clearError = (field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleNumberChange = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    const num = parseFloat(cleanedValue)
    setter(isNaN(num) ? 0 : num)
    clearError('amount')
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    const num = parseInt(cleanedValue) || 0
    setQuantity(num)
    if (num > 0 && unitPrice > 0) {
      setAmount(num * unitPrice)
    } else if (num === 0) {
      setAmount(0)
    }
  }

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    const num = parseFloat(cleanedValue) || 0
    setUnitPrice(num)
    if (quantity > 0 && num > 0) {
      setAmount(quantity * num)
    } else if (num === 0) {
      setAmount(0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (selectedFile.size > maxSize) {
        toast.error("File too large. Maximum size is 5MB")
        e.target.value = ''
        return
      }
      setFile(selectedFile)
      clearError('file')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error("File too large. Maximum size is 5MB")
        return
      }
      setFile(file)
      clearError('file')
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return '📄'
      case 'doc':
      case 'docx': return '📝'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return '🖼️'
      default: return '📎'
    }
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        title,
        description,
        category,
        amount,
        quantity: quantity > 1 ? quantity : undefined,
        unitPrice: unitPrice > 0 ? unitPrice : undefined,
        paymentMethod,
        date,
        dueDate: dueDate || undefined,
        supplierName: supplierName || undefined,
        invoiceNumber: invoiceNumber || undefined,
        receiptNumber: receiptNumber || undefined,
        notes: notes || undefined,
        file: file || undefined,
      })
    } else {
      toast.error('Please fix all validation errors')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 -mx-6 -mt-6 p-6 rounded-t-lg border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Receipt className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {initial ? 'Edit Expense' : 'New Expense Record'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {initial ? 'Update the expense details below' : 'Fill in the details to record a new expense'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={category} 
            onValueChange={(v: ExpenseCategory) => {
              setCategory(v)
              clearError('category')
            }}
          >
            <SelectTrigger className={`w-full h-11 ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-3">
                    <opt.icon className={`size-4 ${opt.color}`} />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="size-3" />
              {errors.category}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            Payment Method <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={paymentMethod} 
            onValueChange={(v: PaymentMethod) => {
              setPaymentMethod(v)
              clearError('paymentMethod')
            }}
          >
            <SelectTrigger className={`w-full h-11 ${errors.paymentMethod ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-green-500" />
                  Cash
                </div>
              </SelectItem>
              <SelectItem value="bank_transfer">
                <div className="flex items-center gap-2">
                  <Building className="size-4 text-blue-500" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="mobile_money">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-purple-500" />
                  Mobile Money
                </div>
              </SelectItem>
              <SelectItem value="cheque">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-orange-500" />
                  Cheque
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentMethod && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="size-3" />
              {errors.paymentMethod}
            </p>
          )}
        </div>
      </div>

      {/* Title - Full Width */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="Enter expense title..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            clearError('title')
          }}
          className={`h-11 ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.title && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="size-3" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Description - Full Width */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          placeholder="Provide a detailed description of the expense..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Quantity & Unit Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quantity</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={quantity === 0 ? '' : quantity}
            onChange={handleQuantityChange}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Unit Price</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={unitPrice === 0 ? '' : unitPrice}
            onChange={handleUnitPriceChange}
            className="h-11"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          Amount <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount === 0 ? '' : amount}
            onChange={handleNumberChange(setAmount)}
            className={`h-11 pl-8 ${errors.amount ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="size-3" />
            {errors.amount}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            Expense Date <span className="text-red-500">*</span>
          </Label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => {
              setDate(e.target.value)
              clearError('date')
            }}
            className={`h-11 ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.date && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="size-3" />
              {errors.date}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Due Date</Label>
          <Input 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            className="h-11"
          />
        </div>
      </div>

      {/* Supplier */}
      {(category === "supplier" || supplierName) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Supplier Name</Label>
          <Input
            placeholder="Enter supplier name..."
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      {/* Invoice & Receipt Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Invoice Number</Label>
          <Input
            placeholder="INV-XXX"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Receipt Number</Label>
          <Input
            placeholder="RCP-XXX"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notes</Label>
        <Textarea
          placeholder="Add any additional notes or comments..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Receipt / Attachment</Label>
        <div
          className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : file 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                : errors.file
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            // File preview when uploaded
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-2xl">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile()
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            // Upload area
            <div className="p-8 text-center">
              <div className="flex justify-center mb-3">
                <div className={`p-3 rounded-full ${errors.file ? 'bg-red-50 dark:bg-red-950/20' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
                  <UploadCloud className={`size-8 ${errors.file ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported: JPG, PNG, PDF, DOC, DOCX (Max 5MB)
              </p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
          />
        </div>
        {errors.file && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="size-3" />
            {errors.file}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={isLoading}
          className="h-11 px-6"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="h-11 px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
        >
          {isLoading ? (
            <>
              <RefreshCw className="size-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {initial ? (
                <>
                  <Edit2 className="size-4 mr-2" />
                  Update Expense
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Record Expense
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function BudgetForm({ 
  onSubmit, 
  onCancel,
  initial,
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  initial?: Budget
}) {
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category || "other")
  const [allocatedAmount, setAllocatedAmount] = useState(initial?.allocatedAmount || 0)
  const [month, setMonth] = useState(initial?.month || new Date().toLocaleString('default', { month: 'long' }))
  const [year, setYear] = useState(initial?.year || new Date().getFullYear())
  const [notes, setNotes] = useState(initial?.notes || "")

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const years = [2024, 2025, 2026, 2027, 2028]

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    const num = parseFloat(cleanedValue)
    setAllocatedAmount(isNaN(num) ? 0 : num)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={category} onValueChange={(v: ExpenseCategory) => setCategory(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier">Supplier Payments</SelectItem>
              <SelectItem value="salary">Salaries & Wages</SelectItem>
              <SelectItem value="rent">Rent / Lease</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="tax">Taxes</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Allocated Amount *</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full"
            value={allocatedAmount === 0 ? '' : allocatedAmount}
            onChange={handleNumberChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Budget notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          category,
          allocatedAmount,
          month,
          year,
          notes,
        })}>
          {initial ? "Update Budget" : "Set Budget"}
        </Button>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const { currentUser } = useApp()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all")
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all")
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "all">("month")
  const [addOpen, setAddOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState("expenses")

  // Fetch expenses from API on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true)
      try {
        const data: any = await expensesService.getAll()
        setExpenses(data)
      } catch (error) {
        console.error('Failed to fetch expenses:', error)
        toast.error('Failed to load expenses')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    if (query) {
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(query.toLowerCase()) ||
        e.description?.toLowerCase().includes(query.toLowerCase()) ||
        e.supplierName?.toLowerCase().includes(query.toLowerCase()) ||
        e.invoiceNumber?.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(e => e.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (dateRange === "today") {
      filtered = filtered.filter(e => new Date(e.date) >= today)
    } else if (dateRange === "week") {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(e => new Date(e.date) >= weekAgo)
    } else if (dateRange === "month") {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(e => new Date(e.date) >= monthAgo)
    } else if (dateRange === "year") {
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      filtered = filtered.filter(e => new Date(e.date) >= yearAgo)
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, query, categoryFilter, statusFilter, dateRange])

  // Statistics
  const stats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const paidExpenses = filteredExpenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0)
    const pendingExpenses = filteredExpenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0)
    
    const categoryTotals: Record<ExpenseCategory, number> = {} as any
    filteredExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
    
    const monthlyData: Record<string, number> = {}
    filteredExpenses.forEach(e => {
      const month = new Date(e.date).toLocaleString('default', { month: 'short', year: 'numeric' })
      monthlyData[month] = (monthlyData[month] || 0) + e.amount
    })
    
    const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }))
    
    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      pendingCount: filteredExpenses.filter(e => e.status === "pending").length,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      averageExpense: filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0,
      monthlyTrend,
    }
  }, [filteredExpenses])

  // Budget vs Actual
  const budgetVsActual = useMemo(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' })
    const currentYear = new Date().getFullYear()
    
    return budgets
      .filter(b => b.month === currentMonth && b.year === currentYear)
      .map(budget => {
        const actual = expenses
          .filter(e => 
            e.category === budget.category && 
            new Date(e.date).getMonth() === new Date().getMonth() &&
            new Date(e.date).getFullYear() === currentYear
          )
          .reduce((sum, e) => sum + e.amount, 0)
        
        return {
          category: budget.category,
          allocated: budget.allocatedAmount,
          actual,
          variance: budget.allocatedAmount - actual,
          variancePercent: budget.allocatedAmount > 0 ? ((budget.allocatedAmount - actual) / budget.allocatedAmount) * 100 : 0,
        }
      })
  }, [budgets, expenses])

  // Category colors
  const categoryColors: Record<ExpenseCategory, string> = {
    supplier: "#ef4444",
    salary: "#3b82f6",
    rent: "#10b981",
    utilities: "#f59e0b",
    marketing: "#8b5cf6",
    maintenance: "#ec4899",
    transport: "#06b6d4",
    tax: "#6b7280",
    insurance: "#14b8a6",
    equipment: "#f97316",
    cleaning: "#84cc16",
    stationery: "#a855f7",
    software: "#22c55e",
    other: "#9ca3af",
  }

  // Add expense with API - BASE64 SUPPORT
  const handleAddExpense = async (data: any) => {
    setIsSubmitting(true)
    try {
      const expenseData = {
        title: data.title || data.description,
        description: data.description,
        category: data.category,
        amount: data.amount,
        quantity: data.quantity || 0,
        unitPrice: data.unitPrice || 0,
        paymentMethod: data.paymentMethod || "cash",
        date: data.date,
        dueDate: data.dueDate || null,
        supplierName: data.supplierName || "",
        invoiceNumber: data.invoiceNumber || "",
        receiptNumber: data.receiptNumber || "",
        notes: data.notes || "",
        status: "paid" as ExpenseStatus,
        recordedBy: currentUser?.name || "System",
        createdBy: currentUser?.name || "System",
      }
      
      // Pass the file to service - it will convert to base64
      const newExpense:any = await expensesService.create(expenseData, data.file)
      
      setExpenses([{
        ...newExpense,
        paymentMethod: newExpense.paymentMethod || "cash"
      }, ...expenses])
      
      setAddOpen(false)
      toast.success(`Expense recorded: ${formatCurrency(data.amount)}`)
    } catch (error: any) {
      console.error('Failed to add expense:', error)
      const errorMsg = error.response?.data?.detail?.[0]?.msg || 'Failed to record expense'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update expense with API - BASE64 SUPPORT
  const handleUpdateExpense = async (data: any) => {
    if (!editingExpense) return
    
    setIsSubmitting(true)
    try {
      const updatedData = {
        title: data.title || data.description,
        description: data.description,
        category: data.category,
        amount: data.amount,
        quantity: data.quantity || 0,
        unitPrice: data.unitPrice || 0,
        paymentMethod: data.paymentMethod || "cash",
        date: data.date,
        dueDate: data.dueDate || null,
        supplierName: data.supplierName || "",
        invoiceNumber: data.invoiceNumber || "",
        receiptNumber: data.receiptNumber || "",
        notes: data.notes || "",
        status: data.status || "paid" as ExpenseStatus,
        recordedBy: currentUser?.name || "System",
        updatedBy: currentUser?.name || "System",
        updatedAt: new Date().toISOString(),
      }
      
      // Pass the file to service - it will convert to base64
      const updatedExpense:any = await expensesService.update(editingExpense.id, updatedData, data.file)
      
      setExpenses(expenses.map(e => e.id === editingExpense.id ? {
        ...updatedExpense,
        paymentMethod: updatedExpense.paymentMethod || "cash"
      } : e))
      
      setEditingExpense(null)
      toast.success("Expense updated")
    } catch (error: any) {
      console.error('Failed to update expense:', error)
      const errorMsg = error.response?.data?.detail?.[0]?.msg || 'Failed to update expense'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete expense with API
  const handleDeleteExpense = async () => {
    if (!deletingExpense) return
    
    setIsSubmitting(true)
    try {
      await expensesService.delete(deletingExpense.id)
      setExpenses(expenses.filter(e => e.id !== deletingExpense.id))
      setDeletingExpense(null)
      toast.success("Expense deleted")
    } catch (error: any) {
      console.error('Failed to delete expense:', error)
      toast.error('Failed to delete expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add budget
  const handleAddBudget = (data: any) => {
    const newBudget: Budget = {
      id: `budget_${Date.now()}`,
      ...data,
      spentAmount: 0,
    }
    
    setBudgets([...budgets, newBudget])
    setBudgetOpen(false)
    toast.success(`Budget set for ${data.category}`)
  }

  // Get status badge
  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
    }
  }

  // Export CSV
  const handleExport = () => {
    if (filteredExpenses.length === 0) {
      toast.error("No expenses to export")
      return
    }
    
    const data = filteredExpenses.map(e => ({
      "Invoice Number": e.invoiceNumber || "-",
      "Category": e.category,
      "Title": e.title || e.description,
      "Amount": formatCurrency(e.amount),
      "Payment Method": formatPaymentMethod(e.paymentMethod),
      "Status": e.status,
      "Date": formatDate(e.date),
      "Supplier": e.supplierName || "-",
      "Recorded By": e.recordedBy || e.createdBy || "-",
    }))

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Expenses exported")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader 
        title="Expenses Management" 
        description="Track operational costs, budgets, and financial planning"
      />
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 px-4 md:px-6 pt-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Record Expense
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <DollarSign className="size-6 text-red-500 dark:text-red-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.paidExpenses)}</p>
              </div>
              <CheckCircle className="size-6 text-green-500 dark:text-green-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pendingExpenses)}</p>
              </div>
              <Clock className="size-6 text-yellow-500 dark:text-yellow-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Count</p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
              </div>
              <AlertCircle className="size-6 text-orange-500 dark:text-orange-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Expense</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageExpense)}</p>
              </div>
              <TrendingUp className="size-6 text-purple-500 dark:text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="budget">Budget & Planning</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                  <SelectTrigger className="sm:w-44">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="supplier">Supplier Payments</SelectItem>
                    <SelectItem value="salary">Salaries</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="tax">Taxes</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
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

            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">{expense.invoiceNumber || "-"}</TableCell>
                        <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize dark:border-gray-700">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{expense.title || expense.description}</TableCell>
                        <TableCell>{expense.recordedBy || expense.createdBy || "-"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs dark:border-gray-700">
                            {formatPaymentMethod(expense.paymentMethod)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => setViewingExpense(expense)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => setEditingExpense(expense)}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive"
                              onClick={() => setDeletingExpense(expense)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="py-12 text-center">
                          <DollarSign className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No expenses recorded</p>
                          <Button 
                            variant="link" 
                            onClick={() => setAddOpen(true)}
                            className="mt-2"
                          >
                            Record your first expense
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Budget vs Actual</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Button onClick={() => setBudgetOpen(true)}>
                <Plus className="size-4 mr-2" />
                Set Budget
              </Button>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Budgeted</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetVsActual.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.allocated)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                        <TableCell className={`text-right ${item.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </TableCell>
                        <TableCell>
                          {item.variancePercent >= 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Under Budget ({item.variancePercent.toFixed(0)}%)
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Over Budget ({Math.abs(item.variancePercent).toFixed(0)}%)
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {budgetVsActual.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center">
                          <p className="text-sm text-muted-foreground">No budgets set for this month</p>
                          <Button 
                            variant="link" 
                            onClick={() => setBudgetOpen(true)}
                            className="mt-2"
                          >
                            Set a budget
                          </Button>
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
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Expense Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="#ef444480" name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Expense Categories</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetVsActual.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="allocated" fill="#3b82f6" name="Budgeted" />
                    <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingUp className="size-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Expense Category</p>
                    <p className="text-xl font-bold capitalize">{stats.topCategory?.name || "N/A"}</p>
                    {stats.topCategory && (
                      <p className="text-xs text-muted-foreground">{formatCurrency(stats.topCategory.amount)}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Efficiency</p>
                    <p className="text-xl font-bold">
                      {stats.totalExpenses > 0 ? ((stats.paidExpenses / stats.totalExpenses) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">of expenses paid</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month vs Last</p>
                    <p className="text-xl font-bold">
                      {stats.monthlyTrend.length >= 2 
                        ? `${((stats.monthlyTrend[stats.monthlyTrend.length - 1]?.amount / stats.monthlyTrend[stats.monthlyTrend.length - 2]?.amount - 1) * 100).toFixed(0)}%`
                        : "0%"}
                    </p>
                    <p className="text-xs text-muted-foreground">change in expenses</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(
                      filteredExpenses.reduce((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + e.amount
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(categoryColors).map(([category, color], index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
            <DialogDescription>Enter the expense details below</DialogDescription>
          </DialogHeader>
          <ExpenseForm 
            onSubmit={handleAddExpense}
            onCancel={() => setAddOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(o) => !o && setEditingExpense(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm 
              initial={editingExpense}
              onSubmit={handleUpdateExpense}
              onCancel={() => setEditingExpense(null)}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={!!viewingExpense} onOpenChange={(o) => !o && setViewingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>{viewingExpense?.invoiceNumber || "No invoice number"}</DialogDescription>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Category:</span>
                <span className="capitalize font-medium">{viewingExpense.category}</span>
                
                <span className="text-muted-foreground">Title:</span>
                <span>{viewingExpense.title || viewingExpense.description}</span>
                
                <span className="text-muted-foreground">Description:</span>
                <span>{viewingExpense.description || "-"}</span>
                
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">{formatCurrency(viewingExpense.amount)}</span>
                
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(viewingExpense.date)}</span>
                
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="capitalize">{formatPaymentMethod(viewingExpense.paymentMethod)}</span>
                
                <span className="text-muted-foreground">Status:</span>
                <span>{getStatusBadge(viewingExpense.status)}</span>
                
                {viewingExpense.quantity && viewingExpense.quantity > 0 && (
                  <>
                    <span className="text-muted-foreground">Quantity:</span>
                    <span>{viewingExpense.quantity}</span>
                  </>
                )}
                
                {viewingExpense.unitPrice && viewingExpense.unitPrice > 0 && (
                  <>
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span>{formatCurrency(viewingExpense.unitPrice)}</span>
                  </>
                )}
                
                {viewingExpense.supplierName && (
                  <>
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{viewingExpense.supplierName}</span>
                  </>
                )}
                
                {viewingExpense.invoiceNumber && (
                  <>
                    <span className="text-muted-foreground">Invoice:</span>
                    <span>{viewingExpense.invoiceNumber}</span>
                  </>
                )}
                
                {viewingExpense.receiptNumber && (
                  <>
                    <span className="text-muted-foreground">Receipt:</span>
                    <span>{viewingExpense.receiptNumber}</span>
                  </>
                )}
                
                {viewingExpense.recordedBy && (
                  <>
                    <span className="text-muted-foreground">Recorded By:</span>
                    <span>{viewingExpense.recordedBy}</span>
                  </>
                )}
                
                {viewingExpense.receiptUrl && (
                  <>
                    <span className="text-muted-foreground">Receipt:</span>
                    <a 
                      href={viewingExpense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  </>
                )}
              </div>
              {viewingExpense.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">{viewingExpense.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Created: {formatDate(viewingExpense.createdAt)} by {viewingExpense.createdBy}</p>
                {viewingExpense.updatedAt && (
                  <p>Updated: {formatDate(viewingExpense.updatedAt)} by {viewingExpense.updatedBy}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(o) => !o && setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Budget Dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Monthly Budget</DialogTitle>
            <DialogDescription>Define budget allocation for expenses</DialogDescription>
          </DialogHeader>
          <BudgetForm 
            onSubmit={handleAddBudget}
            onCancel={() => setBudgetOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}