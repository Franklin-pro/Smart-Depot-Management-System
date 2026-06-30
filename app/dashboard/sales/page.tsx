"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  ShoppingCart, Plus, Search, Download, FileText, 
  Printer, Trash2, CheckCircle, 
  Calendar, DollarSign, TrendingUp, Users, Package, 
  ArrowLeft, RefreshCw, ChevronLeft, ChevronRight,
  CreditCard, Receipt, 
  Percent,
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Product, Customer } from "@/lib/types"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { salesService } from "@/services"
import { useTheme } from "next-themes"

// Types
interface CartItem {
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
}

interface SaleItem {
  productId: string
  product: Product
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface SaleRecord {
  id: string
  invoiceNumber: string
  customerId?: string
  customerName: string
  customerPhone?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  amountPaid: number
  change: number
  status: string
  emptyCasesRecorded: boolean
  createdAt: string
  createdBy: string
  notes?: string
}

// Add to cart form
function AddToCartForm({ 
  products, 
  onAdd, 
  onClose 
}: { 
  products: Product[], 
  onAdd: (item: CartItem) => void, 
  onClose: () => void 
}) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  
  const product = products.find(p => p.id === selectedProduct)
  const maxQuantity = product?.fullCases || 0

  const handleAdd = () => {
    if (!product) {
      toast.error("Please select a product")
      return
    }
    
    if (quantity > maxQuantity) {
      toast.error(`Only ${maxQuantity} cases available in stock`)
      return
    }
    
    onAdd({
      productId: product.id,
      product,
      quantity,
      unitPrice: product.sellingPrice,
      subtotal: quantity * product.sellingPrice,
    })
    
    onClose()
    setSelectedProduct("")
    setQuantity(1)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Product</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a beer product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} - {p.brand} (Stock: {p.fullCases} cases) - {formatCurrency(p.sellingPrice)}/case
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {product && (
        <>
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Stock:</span>
              <span className="font-medium">{product.fullCases} cases</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per case:</span>
              <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deposit per case:</span>
              <span className="font-medium">{formatCurrency(product.depositAmount || 3)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quantity (cases)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxQuantity, parseInt(e.target.value) || 0))}
              />
              <Button 
                variant="outline" 
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              >
                +
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
            </div>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex justify-between font-semibold">
              <span>Subtotal:</span>
              <span>{formatCurrency(quantity * product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>Deposit value:</span>
              <span>{formatCurrency(quantity * (product.depositAmount || 3))}</span>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={!product || quantity < 1}>
          Add to Cart
        </Button>
      </div>
    </div>
  )
}

// Customer selection form
function CustomerSelect({ 
  customers, 
  onSelect, 
  onClose 
}: { 
  customers: Customer[], 
  onSelect: (customer: Customer | null) => void, 
  onClose: () => void 
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none")
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  
  const customer = customers.find(c => c.id === selectedCustomer)

  const handleSelect = () => {
    if (isNewCustomer) {
      if (!newCustomerName) {
        toast.error("Please enter customer name")
        return
      }
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: newCustomerName,
        phone: newCustomerPhone,
        email: "",
        address: "",
        type: "retail",
        totalSpent: 0,
        totalTransactions: 0,
        pendingEmpties: 0,
        totalPurchases: 0,
        refundableDeposits: 0,
        city: "",
        notes: "",
        unpaidBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onSelect(newCustomer)
    } else if (selectedCustomer !== "none" && customer) {
      onSelect(customer)
    } else if (selectedCustomer === "none") {
      onSelect(null)
    }
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          variant={!isNewCustomer ? "default" : "outline"} 
          className="flex-1"
          onClick={() => setIsNewCustomer(false)}
        >
          Existing Customer
        </Button>
        <Button 
          variant={isNewCustomer ? "default" : "outline"} 
          className="flex-1"
          onClick={() => setIsNewCustomer(true)}
        >
          New Customer
        </Button>
      </div>

      {!isNewCustomer ? (
        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Walk-in Customer</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} - {c.phone || "No phone"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input 
              placeholder="Enter customer name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              placeholder="Enter phone number"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSelect}>
          Select Customer
        </Button>
      </div>
    </div>
  )
}

// Payment form
function PaymentForm({ 
  total, 
  onSubmit, 
  onCancel 
}: { 
  total: number, 
  onSubmit: (data: { method: string, amount: number }) => void, 
  onCancel: () => void 
}) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile" | "credit">("cash")
  const [amountPaid, setAmountPaid] = useState(total)

  const change = amountPaid - total
  const isValid = amountPaid >= total

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant={paymentMethod === "cash" ? "default" : "outline"}
            onClick={() => setPaymentMethod("cash")}
            className="gap-2"
          >
            <DollarSign className="size-4" />
            Cash
          </Button>
          <Button 
            variant={paymentMethod === "card" ? "default" : "outline"}
            onClick={() => setPaymentMethod("card")}
            className="gap-2"
          >
            <CreditCard className="size-4" />
            Card
          </Button>
          <Button 
            variant={paymentMethod === "mobile" ? "default" : "outline"}
            onClick={() => setPaymentMethod("mobile")}
            className="gap-2"
          >
            <Smartphone className="size-4" />
            Mobile
          </Button>
          <Button 
            variant={paymentMethod === "credit" ? "default" : "outline"}
            onClick={() => setPaymentMethod("credit")}
            className="gap-2"
          >
            <Receipt className="size-4" />
            Credit
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Amount Paid</Label>
        <Input
          type="number"
          min={total}
          step="1000"
          value={amountPaid}
          onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
        />
        {amountPaid >= total ? (
          <p className="text-xs text-green-600">
            Change: {formatCurrency(change)}
          </p>
        ) : (
          <p className="text-xs text-red-600">
            Insufficient amount. Need {formatCurrency(total - amountPaid)} more.
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({ method: paymentMethod, amount: amountPaid })} disabled={!isValid}>
          Complete Sale
        </Button>
      </div>
    </div>
  )
}

// Receipt modal
function ReceiptModal({ sale, onClose }: { sale: SaleRecord | null, onClose: () => void }) {
  if (!sale) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={!!sale} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sale Receipt</DialogTitle>
          <DialogDescription>
            Invoice: {sale.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4" id="receipt-content">
          <div className="text-center">
            <h3 className="font-bold text-lg">Beer Depot</h3>
            <p className="text-xs text-muted-foreground">123 Main Street, Kigali</p>
            <p className="text-xs text-muted-foreground">Tel: +250 788 123 456</p>
          </div>
          
          <Separator />
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-medium">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customerName}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
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
                {sale.items && sale.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{item.name || "Unknownn"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <Separator />
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal || 0)}</span>
            </div>
            {sale.discount && sale.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            {sale.tax && sale.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax (18%):</span>
                <span>{formatCurrency(sale.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total:</span>
              <span>{formatCurrency(sale.total || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Amount Paid:</span>
              <span>{formatCurrency(sale.amountPaid || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Change:</span>
              <span>{formatCurrency(sale.change || 0)}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-center text-xs text-muted-foreground">
            <p>Payment Method: {sale.paymentMethod ? sale.paymentMethod.toUpperCase() : "CASH"}</p>
            <p>Thank you for your business!</p>
            {sale.emptyCasesRecorded && (
              <p className="text-green-600">✓ Empty cases deposit recorded</p>
            )}
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

// Smartphone icon component
function Smartphone(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  )
}

export default function SalesPage() {
  const { 
    currentUser, 
    products, 
    customers, 
    updateProduct,
    addEmptyCaseTransaction,
    sales = [],
    addSale,
    setSales
  } = useApp()
  
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed")
  const [notes, setNotes] = useState("")
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptSale, setReceiptSale] = useState<SaleRecord | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all")
  
  // Get theme-aware chart colors
  const isDark = theme === 'dark'
  
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    background: isDark ? 'transparent' : 'transparent',
    revenue: '#10b981',
    transactions: '#3b82f6',
    cash: '#10b981',
    card: '#3b82f6',
    mobile: '#f59e0b',
    bank: '#8b5cf6',
    quantity: '#f59e0b',
  }

  // Chart tooltip style
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    color: isDark ? '#f9fafb' : '#111827',
    borderRadius: '8px',
    padding: '12px',
  }

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

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount
  const tax = (subtotal - discountAmount) * 0.18
  const total = subtotal - discountAmount + tax
  
  // Type assertion for sales data - cast to SaleRecord array
  const typedSales = (sales || []) as unknown as SaleRecord[]
  
  // Filter sales
  const filteredSales = useMemo(() => {
    return typedSales.filter(sale => {
      const matchQuery = sale.customerName?.toLowerCase().includes(query.toLowerCase()) ||
                        sale.invoiceNumber?.toLowerCase().includes(query.toLowerCase())
      const matchStatus = statusFilter === "all" || sale.status === statusFilter
      return matchQuery && matchStatus
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [typedSales, query, statusFilter])
  
  // Sales statistics
  const stats = useMemo(() => {
    const completedSales = typedSales.filter(s => s.status === "completed")
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0)
    const totalTransactions = completedSales.length
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const todaySales = completedSales.filter(s => {
      const today = new Date().toDateString()
      return new Date(s.createdAt).toDateString() === today
    })
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    
    return {
      totalRevenue,
      totalTransactions,
      avgOrderValue,
      todayRevenue,
      todayTransactions: todaySales.length,
    }
  }, [typedSales])
  
  // Chart data
  const salesTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      return date.toISOString().split('T')[0]
    }).reverse()
    
    return last7Days.map(date => {
      const daySales = typedSales.filter(s => {
        return s.status === "completed" && s.createdAt.split('T')[0] === date
      })
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: daySales.reduce((sum, s) => sum + s.total, 0),
        transactions: daySales.length,
      }
    })
  }, [typedSales])
  
  const popularProducts = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    
    typedSales.forEach(sale => {
      if (sale.status === "completed" && sale.items) {
        sale.items.forEach(item => {
          const productName = item.product?.name || 
                             products.find(p => p.id === item.productId)?.name || 
                             "Unknown Product"
          
          const existing = productSales.get(item.productId)
          if (existing) {
            existing.quantity += item.quantity || 0
            existing.revenue += item.subtotal || 0
          } else {
            productSales.set(item.productId, {
              name: productName,
              quantity: item.quantity || 0,
              revenue: item.subtotal || 0,
            })
          }
        })
      }
    })
    
    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [typedSales, products])
  
  // Add to cart
  const handleAddToCart = (item: CartItem) => {
    const existing = cart.find(i => i.productId === item.productId)
    if (existing) {
      setCart(cart.map(i => 
        i.productId === item.productId 
          ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unitPrice }
          : i
      ))
    } else {
      setCart([...cart, item])
    }
    toast.success(`Added ${item.quantity} case(s) of ${item.product.name}`)
  }
  
  // Remove from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId))
  }
  
  // Update quantity
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item
    ))
  }
  
  // Complete sale - Updated to use API
  const handleCompleteSale = async (paymentData: { method: string, amount: number }) => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    
    // Check stock availability
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.fullCases < item.quantity) {
        toast.error(`Insufficient stock for ${item.product.name}`)
        return
      }
    }
    
    try {
      // Create sale record
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(typedSales.length + 1).padStart(6, '0')}`
      
      const newSale: SaleRecord = {
        id: `sale_${Date.now()}`,
        invoiceNumber,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        customerPhone: selectedCustomer?.phone,
        items: cart.map(item => ({
          productId: item.productId,
          product: item.product,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        subtotal,
        tax,
        discount: discountAmount,
        total,
        paymentMethod: paymentData.method,
        paymentStatus: paymentData.amount >= total ? "paid" : "partial",
        amountPaid: paymentData.amount,
        change: paymentData.amount - total,
        status: "completed",
        emptyCasesRecorded: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || "System",
        notes,
      }
      
      // ✅ Use the store's addSale which calls the API
      await addSale(newSale as any)
      
      // Update inventory (this will be handled by the store's addSale)
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          // Create empty case transaction for deposit tracking
          addEmptyCaseTransaction({
            productId: product.id,
            productName: product.name,
            totalQuantity: item.quantity,
            depositAmount: product.depositAmount || 3,
            totalDepositValue: item.quantity * (product.depositAmount || 3),
            transactionType: "sale",
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name || "Walk-in Customer",
            status: "pending",
            pendingQuantity: item.quantity,
            returnedQuantity: 0,
            refundedAmount: 0,
            createdBy: currentUser?.name || "System",
            notes: "",
          })
        }
      }
      
      // Reset cart and form
      setCart([])
      setSelectedCustomer(null)
      setDiscount(0)
      setNotes("")
      setPaymentOpen(false)
      
      // Show receipt
      setReceiptSale(newSale)
      toast.success(`Sale completed! Invoice: ${invoiceNumber}`)
      
      // Refresh sales data
      const updatedSales = await salesService.getAll()
      setSales(updatedSales)
      
    } catch (error) {
      console.error('Failed to complete sale:', error)
      toast.error('Failed to complete sale')
    }
  }
  
  // Cancel sale
  const handleCancelSale = () => {
    if (cart.length > 0) {
      setCart([])
      setSelectedCustomer(null)
      setDiscount(0)
      setNotes("")
      toast.info("Sale cancelled")
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading sales...</p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <DashboardHeader 
        title="Point of Sale" 
        description="Process customer sales and track revenue"
      />
      
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <DollarSign className="size-6 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">{stats.todayTransactions}</p>
              </div>
              <ShoppingCart className="size-6 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="size-6 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <Receipt className="size-6 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
              <Package className="size-6 text-cyan-500" />
            </div>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="pos" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pos">Point of Sale</TabsTrigger>
            <TabsTrigger value="history">Sales History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* POS Tab */}
          <TabsContent value="pos" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Product Selection and Cart */}
              <div className="lg:col-span-2 space-y-4">
                {/* Cart Items */}
                <Card className="overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ShoppingCart className="size-4" />
                      Current Sale ({cart.length} items)
                    </h3>
                    <div className="flex gap-2">
                      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="size-4 mr-1" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Cart</DialogTitle>
                            <DialogDescription>
                              Select a product and quantity to add to the current sale
                            </DialogDescription>
                          </DialogHeader>
                          <AddToCartForm 
                            products={products.filter(p => p.fullCases > 0)}
                            onAdd={handleAddToCart}
                            onClose={() => setAddItemOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      {cart.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleCancelSale}>
                          Clear Cart
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{item.product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.product.brand} · {item.product.batchNumber}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-12 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive"
                                onClick={() => handleRemoveFromCart(item.productId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {cart.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center">
                              <ShoppingCart className="mx-auto size-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">
                                Cart is empty. Add items to start a sale.
                              </p>
                              <Button 
                                variant="link" 
                                onClick={() => setAddItemOpen(true)}
                                className="mt-2"
                              >
                                <Plus className="size-4 mr-1" />
                                Add First Item
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
              
              {/* Checkout Section */}
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Sale Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Discount:</span>
                      <div className="flex gap-2">
                        <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-24"
                          placeholder="0"
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (18%):</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Customer:</span>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto"
                          onClick={() => setCustomerSelectOpen(true)}
                        >
                          {selectedCustomer?.name || "Walk-in Customer"} <ChevronRight className="size-3 ml-1" />
                        </Button>
                      </div>
                      
                      {selectedCustomer && (
                        <div className="text-xs text-muted-foreground">
                          {selectedCustomer.phone && <div>📞 {selectedCustomer.phone}</div>}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Notes</Label>
                      <Textarea
                        placeholder="Add sale notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1" 
                      size="lg"
                      disabled={cart.length === 0}
                      onClick={() => setPaymentOpen(true)}
                    >
                      <CreditCard className="size-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                </Card>
                
                {/* Quick Actions */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddItemOpen(true)}>
                      <Plus className="size-4 mr-1" />
                      Add Item
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCustomerSelectOpen(true)}>
                      <Users className="size-4 mr-1" />
                      Add Customer
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Sales History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search invoice or customer..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sales</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                        <TableCell className="text-sm">{formatDate(sale.createdAt)}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sale.status === "completed" ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>
                          ) : (
                            <Badge variant="destructive">Cancelled</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReceiptSale(sale)}
                          >
                            <Printer className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center">
                          <Receipt className="mx-auto size-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No sales found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab - Fixed with theme-aware colors */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sales Trend Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      stroke={chartColors.grid}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      stroke={chartColors.grid}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      stroke={chartColors.grid}
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => 
                        name === "revenue" ? formatCurrency(value) : value
                      }
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                    <Legend 
                      wrapperStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={chartColors.revenue} 
                      name="Revenue" 
                      strokeWidth={2}
                      dot={{ fill: chartColors.revenue, strokeWidth: 2 }}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke={chartColors.transactions} 
                      name="Transactions" 
                      strokeWidth={2}
                      dot={{ fill: chartColors.transactions, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
              
              {/* Popular Products Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Products</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      type="number" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      stroke={chartColors.grid}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      stroke={chartColors.grid}
                    />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => 
                        name === "quantity" ? `${value} cases` : formatCurrency(value)
                      }
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                    <Legend 
                      wrapperStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                    />
                    <Bar dataKey="quantity" fill={chartColors.quantity} name="Cases Sold" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            
            {/* Payment Methods Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: "Cash", value: typedSales.filter(s => s.paymentMethod === "cash" && s.status === "completed").length },
                      { name: "Card", value: typedSales.filter(s => s.paymentMethod === "card" && s.status === "completed").length },
                      { name: "Mobile", value: typedSales.filter(s => s.paymentMethod === "mobile" && s.status === "completed").length },
                      { name: "Bank Transfer", value: typedSales.filter(s => s.paymentMethod === "bank" && s.status === "completed").length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const percentage = (percent * 100).toFixed(0)
                      return `${name}: ${percentage}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={chartColors.cash} />
                    <Cell fill={chartColors.card} />
                    <Cell fill={chartColors.mobile} />
                    <Cell fill={chartColors.bank} />
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                    formatter={(value: number) => `${value} transactions`}
                  />
                  <Legend 
                    wrapperStyle={{ color: isDark ? '#f9fafb' : '#111827' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Customer Select Dialog */}
      <Dialog open={customerSelectOpen} onOpenChange={setCustomerSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Choose an existing customer or add a new one
            </DialogDescription>
          </DialogHeader>
          <CustomerSelect 
            customers={customers}
            onSelect={(customer) => {
              setSelectedCustomer(customer)
              setCustomerSelectOpen(false)
            }}
            onClose={() => setCustomerSelectOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Total amount due: {formatCurrency(total)}
            </DialogDescription>
          </DialogHeader>
          <PaymentForm 
            total={total}
            onSubmit={handleCompleteSale}
            onCancel={() => setPaymentOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Receipt Modal */}
      <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />
    </>
  )
}