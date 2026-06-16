"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Package, Beer, TrendingUp, Split, Plus, Minus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

const categories = ["Lager", "Premium Lager", "Strong Lager", "Stout", "Ale", "Cider"]
const BOTTLES_PER_CASE = 24

export interface BottleInfo {
  damaged: number
  missing: number
  returned: number
  notes?: string
}

export interface PartialCase {
  id: string
  productId?: string
  bottleCount: number
  openedDate: Date
  reason: "sold_individual" | "broken_case" | "sample" | "other"
  notes?: string
}

export type ProductFormValues = Omit<Product, "id" | "createdAt" | "updatedAt"> & {
  bottleInfo?: BottleInfo
  partialCases?: PartialCase[]
  lastStockCheck?: Date
}

// Helper function to clean number input
const cleanNumberInput = (value: string): string => {
  // Remove leading zeros (but keep single zero if it's the only character)
  let cleaned = value.replace(/^0+(?=\d)/, '')
  // Remove non-numeric characters except decimal point
  cleaned = cleaned.replace(/[^0-9.]/g, '')
  // Prevent multiple decimal points
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  return cleaned
}

function toDateInput(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 10)
}

function validateDates(manufactureDate: string, expiryDate: string): string | null {
  const mfg = new Date(manufactureDate)
  const exp = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (exp <= mfg) {
    return "Expiry date must be after manufacture date"
  }
  if (exp < today) {
    return "Expiry date cannot be in the past"
  }
  if (mfg > today) {
    return "Manufacture date cannot be in the future"
  }
  return null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showBottleTracking, setShowBottleTracking] = useState(false)
  const [showPartialCases, setShowPartialCases] = useState(false)
  const [newPartialCaseBottles, setNewPartialCaseBottles] = useState(12)
  const [newPartialCaseReason, setNewPartialCaseReason] = useState<PartialCase["reason"]>("sold_individual")
  const [newPartialCaseNotes, setNewPartialCaseNotes] = useState("")
  
  // Initialize form state with proper defaults
  const [v, setV] = useState<ProductFormValues>(() => ({
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
    depositAmount: initial?.depositAmount ?? 0,
    bottleInfo: (initial as any)?.bottleInfo ?? {
      damaged: 0,
      missing: 0,
      returned: 0,
      notes: "",
    },
    partialCases: (initial as any)?.partialCases ?? [],
    lastStockCheck: (initial as any)?.lastStockCheck ?? new Date(),
  }))

  // Calculate derived values
  const totalFromFullCases = v.fullCases * BOTTLES_PER_CASE
  const totalFromPartialCases = (v.partialCases || []).reduce((sum, pc) => sum + pc.bottleCount, 0)
  const totalCapacity = totalFromFullCases + totalFromPartialCases
  const missingBottles = v.bottleInfo?.missing || 0
  const damagedBottles = v.bottleInfo?.damaged || 0
  const returnedBottles = v.bottleInfo?.returned || 0
  const availableBottles = totalCapacity - missingBottles - damagedBottles + returnedBottles
  const stockIntegrity = totalCapacity > 0 
    ? ((availableBottles - returnedBottles) / totalCapacity) * 100 
    : 100
  const hasIssues = missingBottles > 0 || damagedBottles > 0
  const hasPartialCases = (v.partialCases || []).length > 0

  // Auto-show sections if there are issues
  useEffect(() => {
    if (hasIssues) setShowBottleTracking(true)
    if (hasPartialCases) setShowPartialCases(true)
  }, [hasIssues, hasPartialCases])

  function set<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }))
    if (errors[key as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key as string]
        return newErrors
      })
    }
  }

  function setBottleInfo<K extends keyof BottleInfo>(key: K, val: BottleInfo[K]) {
    setV((prev) => ({
      ...prev,
      bottleInfo: {
        ...prev.bottleInfo!,
        [key]: val,
      },
    }))
  }

  // Handle number input changes
  const handleNumberChange = (setter: (value: number) => void, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    let num = parseFloat(cleanedValue)
    if (isNaN(num)) num = 0
    if (max !== undefined) num = Math.min(num, max)
    setter(num)
  }

  // Handle integer number input changes
  const handleIntegerChange = (setter: (value: number) => void, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    let num = parseInt(cleanedValue)
    if (isNaN(num)) num = 0
    if (max !== undefined) num = Math.min(num, max)
    setter(num)
  }

  function addPartialCase() {
    if (newPartialCaseBottles <= 0 || newPartialCaseBottles >= BOTTLES_PER_CASE) {
      toast.error(`Bottle count must be between 1 and ${BOTTLES_PER_CASE - 1}`)
      return
    }

    // Check if we have full cases to open
    if (v.fullCases === 0 && (v.partialCases || []).length === 0) {
      setErrors(prev => ({ ...prev, partialCases: "No full cases available to open. Please add stock first." }))
      return
    }

    const newPartialCase: PartialCase = {
      id: Date.now().toString(),
      bottleCount: newPartialCaseBottles,
      openedDate: new Date(),
      reason: newPartialCaseReason,
      notes: newPartialCaseNotes || undefined,
    }

    setV(prev => ({
      ...prev,
      partialCases: [...(prev.partialCases || []), newPartialCase],
      fullCases: prev.fullCases - 1, // Reduce full cases by 1
    }))

    // Reset form
    setNewPartialCaseBottles(12)
    setNewPartialCaseReason("sold_individual")
    setNewPartialCaseNotes("")
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.partialCases
      return newErrors
    })
  }

  function removePartialCase(id: string) {
    const partialCaseToRemove = (v.partialCases || []).find(pc => pc.id === id)
    if (partialCaseToRemove) {
      setV(prev => ({
        ...prev,
        partialCases: (prev.partialCases || []).filter(pc => pc.id !== id),
      }))
    }
  }

  function updatePartialCaseBottles(id: string, newBottleCount: number) {
    if (newBottleCount <= 0 || newBottleCount >= BOTTLES_PER_CASE) return
    setV(prev => ({
      ...prev,
      partialCases: (prev.partialCases || []).map(pc =>
        pc.id === id ? { ...pc, bottleCount: newBottleCount } : pc
      ),
    }))
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!v.name.trim()) newErrors.name = "Beer name is required"
    if (!v.brand.trim()) newErrors.brand = "Brand is required"
    if (v.fullCases < 0) newErrors.fullCases = "Full cases cannot be negative"
    if (v.emptyCases < 0) newErrors.emptyCases = "Empty cases cannot be negative"
    if (v.purchasePrice < 0) newErrors.purchasePrice = "Purchase price cannot be negative"
    if (v.sellingPrice < 0) newErrors.sellingPrice = "Selling price cannot be negative"
    if (v.sellingPrice <= v.purchasePrice && v.sellingPrice > 0) {
      newErrors.sellingPrice = "Selling price must be greater than purchase price"
    }
    if (!v.batchNumber.trim()) newErrors.batchNumber = "Batch number is required for tracking"
    
    if (missingBottles + damagedBottles > totalCapacity) {
      newErrors.bottles = "Missing and damaged bottles cannot exceed total capacity"
    }
    if (missingBottles < 0 || damagedBottles < 0 || returnedBottles < 0) {
      newErrors.bottles = "Bottle counts cannot be negative"
    }

    const dateError = validateDates(v.manufactureDate, v.expiryDate)
    if (dateError) newErrors.expiryDate = dateError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    onSubmit({
      ...v,
      manufactureDate: new Date(v.manufactureDate).toISOString(),
      expiryDate: new Date(v.expiryDate).toISOString(),
      lastStockCheck: new Date(),
    })
  }

  const profitMargin = v.sellingPrice > 0 && v.purchasePrice > 0
    ? ((v.sellingPrice - v.purchasePrice) / v.purchasePrice) * 100
    : 0

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "sold_individual": return "Individual Sales"
      case "broken_case": return "Broken Case"
      case "sample": return "Sampling"
      default: return "Other"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="name">Beer name *</Label>
            <Input 
              id="name" 
              value={v.name} 
              onChange={(e) => set("name", e.target.value)} 
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="brand">Brand *</Label>
            <Input 
              id="brand" 
              value={v.brand} 
              onChange={(e) => set("brand", e.target.value)} 
              className={errors.brand ? "border-destructive" : ""}
            />
            {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label>Category *</Label>
            <Select value={v.category} onValueChange={(val) => set("category", val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-full">
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label>Supplier *</Label>
            <Select value={v.supplier} onValueChange={(val) => set("supplier", val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stock Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stock Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="full">Full cases ({BOTTLES_PER_CASE} bottles each) *</Label>
            <Input
              id="full"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={v.fullCases === 0 ? '' : v.fullCases}
              onChange={handleIntegerChange((val) => set("fullCases", Math.max(0, val)))}
              className={errors.fullCases ? "border-destructive" : ""}
            />
            {errors.fullCases && <p className="text-xs text-destructive">{errors.fullCases}</p>}
            <p className="text-xs text-muted-foreground">
              {totalFromFullCases} bottles from full cases
            </p>
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="empty">Empty cases</Label>
            <Input
              id="empty"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={v.emptyCases === 0 ? '' : v.emptyCases}
              onChange={handleIntegerChange((val) => set("emptyCases", Math.max(0, val)))}
            />
            <p className="text-xs text-muted-foreground">
              Deposit value: {formatCurrency(v.depositAmount * v.emptyCases)}
            </p>
          </div>
        </div>

        {/* Partial Cases Section */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPartialCases(!showPartialCases)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {showPartialCases ? "− Hide partial cases" : "+ Add partial cases"}
          </button>
          {hasPartialCases && (
            <Badge variant="outline" className="bg-orange-50">
              {(v.partialCases || []).length} open case(s)
            </Badge>
          )}
        </div>

        {showPartialCases && (
          <div className="rounded-lg border border-muted bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Split className="size-4 text-orange-500" />
              <h4 className="font-medium">Partial Cases (Opened Cases)</h4>
            </div>

            {/* Existing partial cases list */}
            {(v.partialCases || []).length > 0 && (
              <div className="space-y-2">
                <Label>Current Open Cases</Label>
                {(v.partialCases || []).map(pc => (
                  <Card key={pc.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{pc.bottleCount} bottles</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getReasonLabel(pc.reason)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Opened: {new Date(pc.openedDate).toLocaleDateString()}
                          {pc.notes && ` • ${pc.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={pc.bottleCount === 0 ? '' : pc.bottleCount}
                          onChange={(e) => {
                            const cleaned = cleanNumberInput(e.target.value)
                            const num = parseInt(cleaned)
                            if (!isNaN(num) && num > 0 && num < BOTTLES_PER_CASE) {
                              updatePartialCaseBottles(pc.id, num)
                            }
                          }}
                          className="w-20 h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => removePartialCase(pc.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new partial case */}
            <div className="border-t pt-4">
              <Label className="mb-2 block">Open New Case</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="12"
                    value={newPartialCaseBottles === 0 ? '' : newPartialCaseBottles}
                    onChange={(e) => {
                      const cleaned = cleanNumberInput(e.target.value)
                      const num = parseInt(cleaned)
                      if (!isNaN(num)) {
                        setNewPartialCaseBottles(Math.min(BOTTLES_PER_CASE - 1, Math.max(1, num)))
                      } else {
                        setNewPartialCaseBottles(0)
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bottles (1-{BOTTLES_PER_CASE - 1})
                  </p>
                </div>
                <div>
                  <Select value={newPartialCaseReason} onValueChange={(v: any) => setNewPartialCaseReason(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sold_individual">Individual Sales</SelectItem>
                      <SelectItem value="broken_case">Broken Case</SelectItem>
                      <SelectItem value="sample">Sampling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="Notes (optional)"
                    value={newPartialCaseNotes === '' ? '' : newPartialCaseNotes}
                    onChange={(e) => setNewPartialCaseNotes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPartialCase}
                className="mt-3"
              >
                <Plus className="size-4 mr-1" />
                Open Case (uses 1 full case)
              </Button>
              {errors.partialCases && (
                <p className="text-xs text-destructive mt-2">{errors.partialCases}</p>
              )}
            </div>

            {/* Summary of partial cases */}
            <div className="rounded-md bg-background p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">From Partial Cases</div>
                  <div className="font-semibold text-orange-600">
                    {totalFromPartialCases} bottles
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Sellable</div>
                  <div className="font-semibold text-green-600">
                    {totalFromFullCases + totalFromPartialCases} bottles
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottle Tracking Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBottleTracking(!showBottleTracking)}
            className="text-sm text-primary hover:underline"
          >
            {showBottleTracking ? "− Hide bottle tracking" : "+ Track individual bottles"}
          </button>
          {hasIssues && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" />
              Issues detected
            </span>
          )}
        </div>

        {/* Bottle Tracking Section */}
        {showBottleTracking && (
          <div className="rounded-lg border border-muted bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Beer className="size-4 text-muted-foreground" />
              <h4 className="font-medium">Bottle-Level Tracking</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="missing">Missing Bottles</Label>
                <Input
                  id="missing"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={missingBottles === 0 ? '' : missingBottles}
                  onChange={handleIntegerChange(
                    (val) => setBottleInfo("missing", Math.max(0, Math.min(totalCapacity, val))),
                    totalCapacity
                  )}
                />
                <p className="text-xs text-muted-foreground">Theft, loss, unaccounted</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="damaged">Damaged Bottles</Label>
                <Input
                  id="damaged"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={damagedBottles === 0 ? '' : damagedBottles}
                  onChange={handleIntegerChange(
                    (val) => setBottleInfo("damaged", Math.max(0, Math.min(totalCapacity - missingBottles, val))),
                    totalCapacity - missingBottles
                  )}
                />
                <p className="text-xs text-muted-foreground">Broken, leaking, unsellable</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="returned">Returned Bottles</Label>
                <Input
                  id="returned"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={returnedBottles === 0 ? '' : returnedBottles}
                  onChange={handleIntegerChange((val) => setBottleInfo("returned", Math.max(0, val)))}
                />
                <p className="text-xs text-muted-foreground">Added back to inventory</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Stock Notes</Label>
              <Textarea
                id="notes"
                placeholder="Record any issues, discrepancies, or important notes about stock condition..."
                value={v.bottleInfo?.notes || ""}
                onChange={(e) => setBottleInfo("notes", e.target.value)}
                rows={2}
              />
            </div>

            {/* Stock Summary */}
            <div className="rounded-md bg-background p-3">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Total Capacity</div>
                  <div className="font-semibold">{totalCapacity} bottles</div>
                  <div className="text-xs text-muted-foreground">
                    ({v.fullCases} full + {(v.partialCases || []).length} partial)
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Available</div>
                  <div className="font-semibold text-green-600">{availableBottles} bottles</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Lost/Damaged</div>
                  <div className="font-semibold text-destructive">{missingBottles + damagedBottles} bottles</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Integrity</div>
                  <div className={`font-semibold ${stockIntegrity < 90 ? "text-orange-500" : "text-green-600"}`}>
                    {Math.round(stockIntegrity)}%
                  </div>
                </div>
              </div>
            </div>

            {errors.bottles && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errors.bottles}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="purchase">Purchase price (RWF) *</Label>
            <Input
              id="purchase"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={v.purchasePrice === 0 ? '' : v.purchasePrice}
              onChange={handleNumberChange((val) => set("purchasePrice", Math.max(0, val)))}
              className={errors.purchasePrice ? "border-destructive" : ""}
            />
            {errors.purchasePrice && <p className="text-xs text-destructive">{errors.purchasePrice}</p>}
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="selling">Selling price (RWF) *</Label>
            <Input
              id="selling"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={v.sellingPrice === 0 ? '' : v.sellingPrice}
              onChange={handleNumberChange((val) => set("sellingPrice", Math.max(0, val)))}
              className={errors.sellingPrice ? "border-destructive" : ""}
            />
            {errors.sellingPrice && <p className="text-xs text-destructive">{errors.sellingPrice}</p>}
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="deposit">Deposit Amount (RWF)</Label>
            <Input
              id="deposit"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={v.depositAmount === 0 ? '' : v.depositAmount}
              onChange={handleNumberChange((val) => set("depositAmount", Math.max(0, val)))}
            />
          </div>
        </div>

        {/* Profit Margin Display */}
        {v.sellingPrice > 0 && v.purchasePrice > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm">
            <TrendingUp className="size-4 text-blue-600" />
            <div>
              <span className="font-medium text-blue-900">Profit Margin: </span>
              <span className="text-blue-900">{profitMargin.toFixed(1)}%</span>
              <span className="ml-2 text-blue-700">
                ({formatCurrency(v.sellingPrice - v.purchasePrice)} per bottle)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tracking Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tracking Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="batch">Batch number *</Label>
            <Input 
              id="batch" 
              value={v.batchNumber} 
              onChange={(e) => set("batchNumber", e.target.value)} 
              className={errors.batchNumber ? "border-destructive" : ""}
              placeholder="e.g., BATCH-2024-001"
            />
            {errors.batchNumber && <p className="text-xs text-destructive">{errors.batchNumber}</p>}
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="threshold">Low stock threshold (cases)</Label>
            <Input
              id="threshold"
              type="text"
              inputMode="numeric"
              placeholder="40"
              value={v.lowStockThreshold === 0 ? '' : v.lowStockThreshold}
              onChange={handleIntegerChange((val) => set("lowStockThreshold", Math.max(0, val)))}
            />
            <p className="text-xs text-muted-foreground">
              Alert when stock falls below {v.lowStockThreshold} cases
            </p>
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="mfg">Manufacture date</Label>
            <Input
              id="mfg"
              type="date"
              value={toDateInput(v.manufactureDate)}
              onChange={(e) => set("manufactureDate", e.target.value)}
            />
          </div>
          
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="exp">Expiry date *</Label>
            <Input
              id="exp"
              type="date"
              value={toDateInput(v.expiryDate)}
              onChange={(e) => set("expiryDate", e.target.value)}
              className={errors.expiryDate ? "border-destructive" : ""}
            />
            {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="mt-4 self-end">
        {submitLabel}
      </Button>
    </form>
  )
}