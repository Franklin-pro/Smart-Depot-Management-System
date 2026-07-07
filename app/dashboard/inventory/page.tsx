"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Plus, Search, Pencil, Trash2, Package, AlertTriangle, 
  BottleWine, RefreshCw, Split, Beer, Eye, X, 
  Calendar, DollarSign, Building, Hash, Clock, 
  TrendingUp, AlertCircle as AlertCircleIcon, CheckCircle,
  Box, Layers, Archive,
  Activity
} from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productsService } from "@/services"

// Helper function to safely format dates
function safeFormatDate(date: any): string {
  if (!date) return "Never"
  try {
    if (date instanceof Date) {
      return formatDate(date.toISOString())
    }
    if (typeof date === 'string') {
      return formatDate(date)
    }
    if (typeof date === 'object' && date !== null && 'toISOString' in date) {
      return formatDate(date.toISOString())
    }
    return "Invalid date"
  } catch (e) {
    return "Invalid date"
  }
}

// Helper function to get date object safely
function safeParseDate(date: any): Date | null {
  if (!date) return null
  try {
    if (date instanceof Date) return date
    if (typeof date === 'string') return new Date(date)
    if (typeof date === 'object' && date !== null && 'toISOString' in date) {
      return date
    }
    return null
  } catch (e) {
    return null
  }
}

// Get bottles per container from product data
function getBottlesPerContainer(product: ExtendedProduct): number {
  return product.bottlesPerContainer || 24
}

interface BottleInfo {
  damaged: number
  missing: number
  returned: number
  notes?: string
}

interface PartialCase {
  id: string
  productId: string
  bottleCount: number
  openedDate: Date | string
  reason: "sold_individual" | "broken_case" | "sample" | "other"
  notes?: string
}

interface ExtendedProduct extends Product {
  bottleInfo?: BottleInfo
  lastStockCheck?: Date | string | null
  partialCases?: PartialCase[]
  bottlesPerContainer?: number
  containerType?: "case" | "box"
  containerSizeLabel?: string
  bottleType?: "small" | "grand"
  purchasePricePerContainer?: number
  sellingPricePerContainer?: number
}

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, setProducts } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StockStatus | "all">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<ExtendedProduct | null>(null)
  const [deleting, setDeleting] = useState<ExtendedProduct | null>(null)
  const [stockAdjustOpen, setStockAdjustOpen] = useState<ExtendedProduct | null>(null)
  const [partialCaseOpen, setPartialCaseOpen] = useState<ExtendedProduct | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState<ExtendedProduct | null>(null)
  const [newPartialCase, setNewPartialCase] = useState({
    bottleCount: 12,
    reason: "sold_individual" as const,
    notes: ""
  })

  // ✅ Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const data = await productsService.getAll()
        setProducts(data)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        toast.error('Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [setProducts])

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

  // ✅ Updated to use API
  const handleAdd = async (values: ProductFormValues) => {
    try {
      const extendedProduct: any = {
        ...values,
        bottleInfo: values.bottleInfo || {
          damaged: 0,
          missing: 0,
          returned: 0,
        },
        partialCases: values.partialCases || [],
        lastStockCheck: new Date().toISOString(),
      }
      await addProduct(extendedProduct)
      setAddOpen(false)
      toast.success(`${values.name} added to inventory`)
    } catch (error) {
      console.error('Failed to add product:', error)
      toast.error('Failed to add product')
    }
  }

  // ✅ Updated to use API
  const handleEdit = async (values: ProductFormValues) => {
    if (!editing) return
    try {
      await updateProduct(editing.id, values)
      setEditing(null)
      toast.success("Product updated")
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error('Failed to update product')
    }
  }

  // ✅ Updated to use API
  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteProduct(deleting.id)
      toast.success(`${deleting.name} removed`)
      setDeleting(null)
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  function calculateTotalBottles(product: ExtendedProduct): number {
    const bottlesPerContainer = getBottlesPerContainer(product)
    const totalFromFullContainers = product.fullCases * bottlesPerContainer
    const totalFromPartialContainers = (product.partialCases || []).reduce((sum, pc) => sum + pc.bottleCount, 0)
    const missing = product.bottleInfo?.missing || 0
    const damaged = product.bottleInfo?.damaged || 0
    const returned = product.bottleInfo?.returned || 0
    return totalFromFullContainers + totalFromPartialContainers - missing - damaged + returned
  }

  function calculateFullCaseBottles(product: ExtendedProduct): number {
    const bottlesPerContainer = getBottlesPerContainer(product)
    return product.fullCases * bottlesPerContainer
  }

  function calculatePartialCaseBottles(product: ExtendedProduct): number {
    return (product.partialCases || []).reduce((sum, pc) => sum + pc.bottleCount, 0)
  }

  function calculateMissingBottles(product: ExtendedProduct): number {
    return product.bottleInfo?.missing || 0
  }

  function calculateDamagedBottles(product: ExtendedProduct): number {
    return product.bottleInfo?.damaged || 0
  }

  function calculateReturnedBottles(product: ExtendedProduct): number {
    return product.bottleInfo?.returned || 0
  }

  function getStockIntegrity(product: ExtendedProduct): number {
    const bottlesPerContainer = getBottlesPerContainer(product)
    const totalFromFullContainers = product.fullCases * bottlesPerContainer
    const totalFromPartialContainers = (product.partialCases || []).reduce((sum, pc) => sum + pc.bottleCount, 0)
    const totalPossible = totalFromFullContainers + totalFromPartialContainers
    const totalAvailable = calculateTotalBottles(product)
    if (totalPossible === 0) return 100
    return (totalAvailable / totalPossible) * 100
  }

  function getEmptyCasesValue(product: ExtendedProduct): number {
    return (product.emptyCases || 0) * (product.depositAmount || 0)
  }

  // ✅ Updated to use API
  const handleStockAdjustment = async (product: ExtendedProduct, adjustments: Partial<BottleInfo>) => {
    const updatedProduct = {
      ...product,
      bottleInfo: {
        ...product.bottleInfo,
        damaged: product.bottleInfo?.damaged || 0,
        missing: product.bottleInfo?.missing || 0,
        returned: product.bottleInfo?.returned || 0,
        notes: product.bottleInfo?.notes || "",
        ...adjustments,
      },
      lastStockCheck: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    try {
      await updateProduct(product.id, updatedProduct)
      setStockAdjustOpen(null)
      toast.success("Stock levels updated")
    } catch (error) {
      console.error('Failed to update stock:', error)
      toast.error('Failed to update stock levels')
    }
  }

  const handleAddPartialCase = async (product: ExtendedProduct) => {
    const bottlesPerContainer = getBottlesPerContainer(product)
    
    if (newPartialCase.bottleCount <= 0 || newPartialCase.bottleCount >= bottlesPerContainer) {
      toast.error(`Bottle count must be between 1 and ${bottlesPerContainer - 1}`)
      return
    }

    if (product.fullCases === 0 && (product.partialCases || []).length === 0) {
      toast.error("No full containers available to open. Please add stock first.")
      return
    }

    const containerLabel = product.containerType === "box" ? "box" : "case"

    const updatedProduct = {
      ...product,
      partialCases: [
        ...(product.partialCases || []),
        {
          id: Date.now().toString(),
          productId: product.id,
          bottleCount: newPartialCase.bottleCount,
          openedDate: new Date().toISOString(),
          reason: newPartialCase.reason,
          notes: newPartialCase.notes || undefined,
        }
      ],
      fullCases: product.fullCases - 1,
      updatedAt: new Date().toISOString(),
    }
    
    try {
      await updateProduct(product.id, updatedProduct)
      setPartialCaseOpen(null)
      setNewPartialCase({ bottleCount: Math.floor(bottlesPerContainer / 2), reason: "sold_individual", notes: "" })
      toast.success(`Opened partial ${containerLabel} with ${newPartialCase.bottleCount} bottles`)
    } catch (error) {
      console.error('Failed to open partial case:', error)
      toast.error('Failed to open partial case')
    }
  }

  const handleClosePartialCase = async (product: ExtendedProduct, partialCaseId: string) => {
    const partialCase = (product.partialCases || []).find(pc => pc.id === partialCaseId)
    if (!partialCase) return

    const updatedProduct = {
      ...product,
      partialCases: (product.partialCases || []).filter(pc => pc.id !== partialCaseId),
      updatedAt: new Date().toISOString(),
    }
    
    try {
      await updateProduct(product.id, updatedProduct)
      toast.success(`Closed partial case, ${partialCase.bottleCount} bottles returned to inventory`)
    } catch (error) {
      console.error('Failed to close partial case:', error)
      toast.error('Failed to close partial case')
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "sold_individual": return "Individual Sales"
      case "broken_case": return "Broken Container"
      case "sample": return "Sampling"
      default: return "Other"
    }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "sold_individual": return <TrendingUp className="size-3" />
      case "broken_case": return <AlertTriangle className="size-3" />
      case "sample": return <Beer className="size-3" />
      default: return <Package className="size-3" />
    }
  }

  // Product Details Dialog Component
  function ProductDetailsDialog({ product, onClose }: { product: ExtendedProduct; onClose: () => void }) {
    const bottlesPerContainer = getBottlesPerContainer(product)
    const totalBottles = calculateTotalBottles(product)
    const fullCaseBottles = calculateFullCaseBottles(product)
    const partialCaseBottles = calculatePartialCaseBottles(product)
    const missingBottles = calculateMissingBottles(product)
    const damagedBottles = calculateDamagedBottles(product)
    const returnedBottles = calculateReturnedBottles(product)
    const integrity = getStockIntegrity(product)
    const daysToExpiry = daysUntil(product.expiryDate)
    const emptyCasesValue = getEmptyCasesValue(product)
    const profitMargin = product.sellingPrice > 0 && product.purchasePrice > 0
      ? ((product.sellingPrice - product.purchasePrice) / product.purchasePrice) * 100
      : 0

    const containerLabel = product.containerType === "box" ? "Box" : "Case"

    return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
  <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto sm:max-w-6xl xl:max-w-7xl">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>{product.name}</span>
        <Badge variant="outline" className="ml-2">
          {product.batchNumber}
        </Badge>
      </DialogTitle>
      <DialogDescription>
        {product.brand} · {product.category} · {product.bottleType || "Grand"} · {bottlesPerContainer} bottles/{containerLabel.toLowerCase()}
      </DialogDescription>
    </DialogHeader>

    <Tabs defaultValue="overview" className="mt-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="partial-cases">Partial {containerLabel}s</TabsTrigger>
        <TabsTrigger value="bottles">Bottle Tracking</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="size-4" />
              Full {containerLabel}s
            </div>
            <div className="text-2xl font-bold">{product.fullCases}</div>
            <div className="text-xs text-muted-foreground">{fullCaseBottles} bottles</div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="size-4" />
              Partial {containerLabel}s
            </div>
            <div className="text-2xl font-bold text-orange-600">{product.partialCases?.length || 0}</div>
            <div className="text-xs text-muted-foreground">{partialCaseBottles} bottles</div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BottleWine className="size-4" />
              Total Bottles
            </div>
            <div className="text-2xl font-bold text-green-600">{totalBottles}</div>
            <div className="text-xs text-muted-foreground">sellable</div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Archive className="size-4" />
              Empty {containerLabel}s
            </div>
            <div className="text-2xl font-bold">{product.emptyCases || 0}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(emptyCasesValue)} deposit</div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="size-4" />
              Expiry Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacture Date:</span>
                <span>{formatDate(product.manufactureDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span className={daysToExpiry < 0 ? "text-destructive" : daysToExpiry < 30 ? "text-orange-500" : ""}>
                  {formatDate(product.expiryDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Until Expiry:</span>
                <Badge variant={daysToExpiry < 0 ? "destructive" : daysToExpiry < 30 ? "outline" : "default"}>
                  {daysToExpiry < 0 ? "Expired" : `${daysToExpiry} days`}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Building className="size-4" />
              Supplier Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span>{product.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Number:</span>
                <span className="font-mono">{product.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Stock Check:</span>
                <span>{safeFormatDate(product.lastStockCheck)}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="size-4" />
            Stock Health
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Stock Integrity</span>
                <span>{Math.round(integrity)}%</span>
              </div>
              <Progress value={integrity} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Missing</div>
                <div className="font-semibold text-destructive">{missingBottles}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Damaged</div>
                <div className="font-semibold text-orange-500">{damagedBottles}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Returned</div>
                <div className="font-semibold text-green-600">{returnedBottles}</div>
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>

      {/* Partial Cases Tab */}
      <TabsContent value="partial-cases" className="space-y-4">
        {(product.partialCases || []).length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No open partial {containerLabel.toLowerCase()}s for this product</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                onClose()
                setPartialCaseOpen(product)
              }}
            >
              <Split className="size-4 mr-2" />
              Open a {containerLabel}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {(product.partialCases || []).map((pc, index) => (
              <Card key={pc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        {containerLabel} #{index + 1}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getReasonIcon(pc.reason)}
                        {getReasonLabel(pc.reason)}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 mt-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Bottles in {containerLabel}</div>
                        <div className="text-xl font-semibold">{pc.bottleCount} / {bottlesPerContainer}</div>
                        <Progress 
                          value={(pc.bottleCount / bottlesPerContainer) * 100} 
                          className="h-1 mt-1" 
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Opened Date</div>
                        <div className="font-medium">{safeFormatDate(pc.openedDate)}</div>
                      </div>
                      {pc.notes && (
                        <div className="sm:col-span-2">
                          <div className="text-xs text-muted-foreground">Notes</div>
                          <div className="text-sm bg-muted p-2 rounded-md mt-1">{pc.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleClosePartialCase(product, pc.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}

            <Card className="p-4 bg-muted/30">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Partial {containerLabel}s:</span>
                  <div className="font-bold">{(product.partialCases || []).length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Bottles in Partial {containerLabel}s:</span>
                  <div className="font-bold text-orange-600">{partialCaseBottles}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Average Bottles per {containerLabel}:</span>
                  <div className="font-bold">
                    {Math.round(partialCaseBottles / (product.partialCases?.length || 1))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Missing from Full {containerLabel}s:</span>
                  <div className="font-bold text-destructive">
                    {bottlesPerContainer * product.fullCases - fullCaseBottles}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* Bottle Tracking Tab */}
      <TabsContent value="bottles" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircleIcon className="size-4 text-destructive" />
              Issues
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-destructive/10 rounded-lg">
                <span>Missing Bottles</span>
                <span className="font-bold text-destructive">{missingBottles}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded-lg">
                <span>Damaged Bottles</span>
                <span className="font-bold text-orange-500">{damagedBottles}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-lg">
                <span>Returned Bottles</span>
                <span className="font-bold text-green-600">{returnedBottles}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              Good Stock
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-lg">
                <span>Full {containerLabel} Bottles</span>
                <span className="font-bold text-green-600">{fullCaseBottles}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg">
                <span>Partial {containerLabel} Bottles</span>
                <span className="font-bold text-blue-600">{partialCaseBottles}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-500/10 rounded-lg">
                <span>Total Sellable</span>
                <span className="font-bold text-purple-600">{totalBottles}</span>
              </div>
            </div>
          </Card>
        </div>

        {(product.bottleInfo?.notes) && (
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Stock Notes</h4>
            <p className="text-sm bg-muted p-3 rounded-md">{product.bottleInfo.notes}</p>
          </Card>
        )}

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Stock History</h4>
          <div className="text-sm text-muted-foreground">
            Last checked: {safeFormatDate(product.lastStockCheck)}
          </div>
        </Card>
      </TabsContent>

      {/* Financial Tab */}
      <TabsContent value="financial" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Pricing</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price per {containerLabel}:</span>
                <span>{formatCurrency(product.purchasePricePerContainer || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling Price per {containerLabel}:</span>
                <span className="font-semibold">{formatCurrency(product.sellingPricePerContainer || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price per Bottle:</span>
                <span>{formatCurrency(product.purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling Price per Bottle:</span>
                <span className="font-semibold">{formatCurrency(product.sellingPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit per Bottle:</span>
                <span className="text-green-600">{formatCurrency(product.sellingPrice - product.purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit Margin:</span>
                <span className="text-blue-600">{profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-3">Deposit Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit per {containerLabel}:</span>
                <span>{formatCurrency(product.depositAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empty {containerLabel}s:</span>
                <span>{product.emptyCases || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deposit Value:</span>
                <span className="font-semibold">{formatCurrency(emptyCasesValue)}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h4 className="font-semibold mb-3">Inventory Value</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Bottles:</span>
              <span>{totalBottles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stock Value (Cost):</span>
              <span>{formatCurrency(totalBottles * product.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Revenue:</span>
              <span className="text-green-600">{formatCurrency(totalBottles * product.sellingPrice)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Profit:</span>
              <span className="text-blue-600">{formatCurrency(totalBottles * (product.sellingPrice - product.purchasePrice))}</span>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>

    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      <Button onClick={() => {
        onClose()
        setEditing(product)
      }}>
        <Pencil className="size-4 mr-2" />
        Edit Product
      </Button>
    </div>
  </DialogContent>
</Dialog>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <>
        <DashboardHeader title="Inventory" description="Manage your stock with bottle-level tracking" />
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
                  <DialogTitle>Add new stock</DialogTitle>
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
                    <TableHead className="text-right">Full Containers</TableHead>
                    <TableHead className="text-right">Partial Containers</TableHead>
                    <TableHead className="text-right">Empty Containers</TableHead>
                    <TableHead className="text-right">Bottle Details</TableHead>
                    <TableHead className="text-right">Total Bottles</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Integrity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const extendedP = p as ExtendedProduct
                    const bottlesPerContainer = getBottlesPerContainer(extendedP)
                    const d = daysUntil(p.expiryDate)
                    const totalBottles = calculateTotalBottles(extendedP)
                    const fullCaseBottles = calculateFullCaseBottles(extendedP)
                    const partialCaseBottles = calculatePartialCaseBottles(extendedP)
                    const missingBottles = calculateMissingBottles(extendedP)
                    const damagedBottles = calculateDamagedBottles(extendedP)
                    const returnedBottles = calculateReturnedBottles(extendedP)
                    const integrity = getStockIntegrity(extendedP)
                    const hasIssues = missingBottles > 0 || damagedBottles > 0
                    const emptyCasesValue = getEmptyCasesValue(extendedP)
                    const partialCasesCount = (extendedP.partialCases || []).length
                    const containerLabel = extendedP.containerType === "box" ? "Box" : "Case"
                    
                    return (
                      <TableRow key={p.id} className={hasIssues ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.brand} · {p.batchNumber}
                            </span>
                            {extendedP.bottleType && (
                              <Badge variant="outline" className="mt-1 text-xs w-fit">
                                {extendedP.bottleType} · {bottlesPerContainer}/{containerLabel.toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(p.fullCases)}
                          <div className="text-xs text-muted-foreground">
                            ({fullCaseBottles} bottles)
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {partialCasesCount > 0 ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-orange-600">
                                {partialCasesCount} {containerLabel.toLowerCase()}{partialCasesCount !== 1 ? 's' : ''}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                ({partialCaseBottles} bottles)
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatNumber(p.emptyCases || 0)}</span>
                            {emptyCasesValue > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Deposit: {formatCurrency(emptyCasesValue)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 text-sm">
                            {missingBottles > 0 && (
                              <div className="flex items-center justify-end gap-1 text-destructive">
                                <AlertTriangle className="size-3" />
                                <span>{missingBottles} missing</span>
                              </div>
                            )}
                            {damagedBottles > 0 && (
                              <div className="flex items-center justify-end gap-1 text-orange-500">
                                <AlertTriangle className="size-3" />
                                <span>{damagedBottles} damaged</span>
                              </div>
                            )}
                            {returnedBottles > 0 && (
                              <div className="flex items-center justify-end gap-1 text-green-500">
                                <RefreshCw className="size-3" />
                                <span>+{returnedBottles} returned</span>
                              </div>
                            )}
                            {!hasIssues && returnedBottles === 0 && (
                              <span className="text-green-500">All accounted</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">{formatNumber(totalBottles)}</div>
                          <div className="text-xs text-muted-foreground">
                            total sellable
                          </div>
                        </TableCell>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-24">
                                <Progress 
                                  value={integrity} 
                                  className={`h-2 ${
                                    integrity < 60 ? "bg-destructive" : 
                                    integrity < 90 ? "bg-orange-500" : "bg-green-500"
                                  }`} 
                                />
                                <div className="mt-1 text-center text-xs font-medium">
                                  {Math.round(integrity)}%
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Stock integrity: {Math.round(integrity)}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={getStockStatus(p)} />
                            {partialCasesCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-orange-50">
                                {partialCasesCount} open {containerLabel.toLowerCase()}(s)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8"
                                  onClick={() => setPartialCaseOpen(extendedP)}
                                >
                                  <Split className="size-4" />
                                  <span className="sr-only">Open {containerLabel}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Create partial {containerLabel.toLowerCase()}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8"
                                  onClick={() => setStockAdjustOpen(extendedP)}
                                >
                                  <BottleWine className="size-4" />
                                  <span className="sr-only">Adjust Bottles</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Track missing/damaged bottles</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-8"
                                  onClick={() => setViewDetailsOpen(extendedP)}
                                >
                                  <Eye className="size-4" />
                                  <span className="sr-only">View Details</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View product details</TooltipContent>
                            </Tooltip>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(extendedP)}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleting(extendedP)}
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
                      <TableCell colSpan={12} className="py-12 text-center">
                        <Package className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No products match your filters.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="text-2xl font-bold">{products.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Bottles</div>
              <div className="text-2xl font-bold">
                {products.reduce((sum, p) => {
                  const ep = p as ExtendedProduct
                  return sum + calculateTotalBottles(ep)
                }, 0)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Open Partial Containers</div>
              <div className="text-2xl font-bold text-orange-600">
                {products.reduce((sum, p) => {
                  const ep = p as ExtendedProduct
                  return sum + (ep.partialCases?.length || 0)
                }, 0)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Missing Bottles</div>
              <div className="text-2xl font-bold text-red-600">
                {products.reduce((sum, p) => {
                  const ep = p as ExtendedProduct
                  return sum + calculateMissingBottles(ep)
                }, 0)}
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filtered.length} of {products.length} products
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/inventory/reports">
                  View Reports
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/inventory/add">
                  <Plus className="size-4" />
                  Add stock page
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* View Details Dialog */}
        {viewDetailsOpen && (
          <ProductDetailsDialog 
            product={viewDetailsOpen} 
            onClose={() => setViewDetailsOpen(null)} 
          />
        )}

        {/* Partial Case Dialog */}
        <Dialog open={!!partialCaseOpen} onOpenChange={(o) => !o && setPartialCaseOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a {partialCaseOpen?.containerType === "box" ? "Box" : "Case"} - {partialCaseOpen?.name}</DialogTitle>
              <DialogDescription>
                Split a full container for individual bottle sales.
              </DialogDescription>
            </DialogHeader>
            {partialCaseOpen && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Available Full Containers</div>
                      <div className="font-semibold text-lg">{partialCaseOpen.fullCases}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Open Containers</div>
                      <div className="font-semibold text-lg text-orange-600">
                        {partialCaseOpen.partialCases?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Number of Bottles in this Container</Label>
                    <Input
                      type="number"
                      min={1}
                      max={getBottlesPerContainer(partialCaseOpen) - 1}
                      value={newPartialCase.bottleCount}
                      onChange={(e) => setNewPartialCase({ ...newPartialCase, bottleCount: Math.min(getBottlesPerContainer(partialCaseOpen) - 1, Math.max(1, parseInt(e.target.value) || 0)) })}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      How many bottles are currently in this opened container? (1-{getBottlesPerContainer(partialCaseOpen) - 1})
                    </p>
                  </div>

                  <div>
                    <Label>Reason for Opening</Label>
                    <Select value={newPartialCase.reason} onValueChange={(v: any) => setNewPartialCase({ ...newPartialCase, reason: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sold_individual">Selling individually</SelectItem>
                        <SelectItem value="broken_case">Container was damaged/broken</SelectItem>
                        <SelectItem value="sample">Sampling / Promotion</SelectItem>
                        <SelectItem value="other">Other reason</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      placeholder="Add any notes about this partial container..."
                      value={newPartialCase.notes}
                      onChange={(e) => setNewPartialCase({ ...newPartialCase, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4" />
                    <div>
                      <p className="font-medium">Note</p>
                      <p className="text-xs">
                        One full container will be removed from inventory and replaced with a partial container record.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setPartialCaseOpen(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleAddPartialCase(partialCaseOpen)}>
                    <Split className="size-4 mr-2" />
                    Open Container
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stock Adjustment Dialog */}
        <Dialog open={!!stockAdjustOpen} onOpenChange={(o) => !o && setStockAdjustOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock Levels - {stockAdjustOpen?.name}</DialogTitle>
              <DialogDescription>
                Record missing, damaged, or returned bottles across all containers.
              </DialogDescription>
            </DialogHeader>
            {stockAdjustOpen && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Full Containers</div>
                      <div className="font-semibold">{stockAdjustOpen.fullCases}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Partial Containers</div>
                      <div className="font-semibold">{stockAdjustOpen.partialCases?.length || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Bottles</div>
                      <div className="font-semibold">{calculateTotalBottles(stockAdjustOpen)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Empty Containers</div>
                      <div className="font-semibold">{stockAdjustOpen.emptyCases || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Missing Bottles</label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={stockAdjustOpen.bottleInfo?.missing || 0}
                      onChange={(e) => {
                        const missing = parseInt(e.target.value) || 0
                        handleStockAdjustment(stockAdjustOpen, { missing })
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bottles that cannot be accounted for (theft, loss, breakage)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Damaged Bottles</label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={stockAdjustOpen.bottleInfo?.damaged || 0}
                      onChange={(e) => {
                        const damaged = parseInt(e.target.value) || 0
                        handleStockAdjustment(stockAdjustOpen, { damaged })
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Broken, leaking, or otherwise unsellable bottles
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Returned Bottles</label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={stockAdjustOpen.bottleInfo?.returned || 0}
                      onChange={(e) => {
                        const returned = parseInt(e.target.value) || 0
                        handleStockAdjustment(stockAdjustOpen, { returned })
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Bottles returned from customers (adds to inventory)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      placeholder="Optional notes about stock discrepancy"
                      defaultValue={stockAdjustOpen.bottleInfo?.notes || ""}
                      onChange={(e) => {
                        handleStockAdjustment(stockAdjustOpen, { notes: e.target.value })
                      }}
                    />
                  </div>
                </div>

                {(stockAdjustOpen.partialCases || []).length > 0 && (
                  <div className="rounded-md border p-3">
                    <p className="text-sm font-medium mb-2">Open Partial Containers</p>
                    <div className="space-y-2">
                      {(stockAdjustOpen.partialCases || []).map(pc => (
                        <div key={pc.id} className="flex justify-between text-sm border-b pb-1">
                          <span>{pc.bottleCount} bottles</span>
                          <span className="text-xs text-muted-foreground">{getReasonLabel(pc.reason)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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
    </TooltipProvider>
  )
}