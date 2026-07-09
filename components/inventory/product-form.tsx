"use client"

import { useState, useEffect, useRef } from "react"
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
import { 
  AlertCircle, 
  Package, 
  Beer, 
  TrendingUp, 
  Split, 
  Plus, 
  Trash2, 
  Wine,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Calendar,
  DollarSign,
  ClipboardList,
  Box,
  Ruler,
  Pencil,
  Truck,
  Receipt,
  CreditCard,
  PackageCheck,
  PackageX,
  Clock,
  Send
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const categories = ["Beer", "Liquor", "Wine"]

// Container configuration based on category
interface ContainerConfig {
  type: "case" | "box"
  defaultBottlesPerContainer: number
  containerLabel: string
  allowSizeCustomization: boolean
  allowEmptyBoxes: boolean
}

const getContainerConfig = (category: string): ContainerConfig => {
  switch (category) {
    case "Liquor":
      return {
        type: "box",
        defaultBottlesPerContainer: 12,
        containerLabel: "Box",
        allowSizeCustomization: true,
        allowEmptyBoxes: false,
      }
    case "Wine":
      return {
        type: "case",
        defaultBottlesPerContainer: 12,
        containerLabel: "Case",
        allowSizeCustomization: true,
        allowEmptyBoxes: false,
      }
    case "Beer":
      return {
        type: "case",
        defaultBottlesPerContainer: 24,
        containerLabel: "Case",
        allowSizeCustomization: true,
        allowEmptyBoxes: true,
      }
    default:
      return {
        type: "case",
        defaultBottlesPerContainer: 24,
        containerLabel: "Case",
        allowSizeCustomization: false,
        allowEmptyBoxes: true,
      }
  }
}

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
  reason: "sold_individual" | "broken_container" | "sample" | "other"
  notes?: string
  containerType?: "case" | "box"
  sizeLabel?: string
  bottleType?: "small" | "grand"
}

export interface PaymentRecord {
  id: string
  amount: number
  casesPaid: number
  paymentDate: Date
  paymentMethod: "cash" | "bank_transfer" | "mobile_money" | "check"
  reference?: string
  notes?: string
}

export type ProductFormValues = Omit<Product, "id" | "createdAt" | "updatedAt"> & {
  bottleInfo?: BottleInfo
  partialCases?: PartialCase[]
  lastStockCheck?: Date
  containerType?: "case" | "box"
  bottlesPerContainer?: number
  containerSizeLabel?: string
  bottleType?: "small" | "grand"
  purchasePricePerContainer?: number 
  sellingPricePerContainer?: number
  // Supplier delivery tracking
  supplierSent?: number  // Total cases YOU requested/ordered from the supplier
  receivedCases?: number  // Cases already received
  remainingToReceive?: number // Cases still owed to you by the supplier (supplierSent - received)
  supplierDebtValue?: number // Monetary value of the cases the supplier still owes you
  payments?: PaymentRecord[]
  totalPaid?: number
  balanceDue?: number // Amount YOU still owe the supplier for cases already received
  
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

// Step Configuration
const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'stock', label: 'Stock Details', icon: Box },
  { id: 'pricing', label: 'Pricing & Payment', icon: DollarSign },
  { id: 'tracking', label: 'Tracking', icon: ClipboardList },
]

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
  const [currentStep, setCurrentStep] = useState(0)
  const [showBottleTracking, setShowBottleTracking] = useState(false)
  const [showPartialCases, setShowPartialCases] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const [newPartialCaseBottles, setNewPartialCaseBottles] = useState(12)
  const [newPartialCaseReason, setNewPartialCaseReason] = useState<PartialCase["reason"]>("sold_individual")
  const [newPartialCaseNotes, setNewPartialCaseNotes] = useState("")
  const [selectedBottleType, setSelectedBottleType] = useState<"small" | "grand">("grand")
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentCases, setPaymentCases] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord["paymentMethod"]>("cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  
  const isInitialized = useRef(false)
  
  // Get initial container config
  const initialCategory = initial?.category || "Beer"
  const initialConfig = getContainerConfig(initialCategory)
  
  // Initialize form state with proper defaults
  const [v, setV] = useState<ProductFormValues>(() => ({
    name: initial?.name ?? "",
    brand: initial?.brand ?? "",
    category: initial?.category ?? "Beer",
    fullCases: initial?.fullCases ?? 0,
    emptyCases: initial?.emptyCases ?? 0,
    purchasePrice: initial?.purchasePrice ?? 0,
    sellingPrice: initial?.sellingPrice ?? 0,
    purchasePricePerContainer: (initial as any)?.purchasePricePerContainer ?? 0,
    sellingPricePerContainer: (initial as any)?.sellingPricePerContainer ?? 0,
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
    containerType: (initial as any)?.containerType ?? initialConfig.type,
    bottlesPerContainer: (initial as any)?.bottlesPerContainer ?? initialConfig.defaultBottlesPerContainer,
    containerSizeLabel: (initial as any)?.containerSizeLabel ?? "Grand",
    bottleType: (initial as any)?.bottleType ?? "grand",
    // Supplier delivery tracking
    supplierSent: (initial as any)?.supplierSent ?? 0,
    receivedCases: (initial as any)?.receivedCases ?? 0,
    remainingToReceive: (initial as any)?.remainingToReceive ?? 0,
    payments: (initial as any)?.payments ?? [],
    totalPaid: (initial as any)?.totalPaid ?? 0,
    balanceDue: (initial as any)?.balanceDue ?? 0,
  }))

  // Get current container configuration based on category
  const containerConfig = getContainerConfig(v.category)
  const BOTTLES_PER_CONTAINER = v.bottlesPerContainer ?? 24

  const supplierSent = v.supplierSent ?? 0
  const receivedCases = v.receivedCases ?? 0

  // Calculate derived values
  const totalFromFullContainers = v.fullCases * BOTTLES_PER_CONTAINER
  const totalFromPartialContainers = (v.partialCases || []).reduce((sum, pc) => sum + pc.bottleCount, 0)
  const totalCapacity = totalFromFullContainers + totalFromPartialContainers
  const missingBottles = v.bottleInfo?.missing || 0
  const damagedBottles = v.bottleInfo?.damaged || 0
  const returnedBottles = v.bottleInfo?.returned || 0
  const availableBottles = totalCapacity - missingBottles - damagedBottles + returnedBottles
  const stockIntegrity = totalCapacity > 0 
    ? ((availableBottles - returnedBottles) / totalCapacity) * 100 
    : 100
  const hasIssues = missingBottles > 0 || damagedBottles > 0
  const hasPartialCases = (v.partialCases || []).length > 0

  const purchasePricePerContainer = v.purchasePricePerContainer ?? 0
  const sellingPricePerContainer = v.sellingPricePerContainer ?? 0

  const profitMarginPerContainer = sellingPricePerContainer > 0 && purchasePricePerContainer > 0
    ? ((sellingPricePerContainer - purchasePricePerContainer) / purchasePricePerContainer) * 100
    : 0

  // Calculate payment totals
  const totalPaid = (v.payments || []).reduce((sum, p) => sum + p.amount, 0)
  const totalCasesPaid = (v.payments || []).reduce((sum, p) => sum + p.casesPaid, 0)
  // Value of the FULL order you requested — you can pay against this even before cases arrive
  // (e.g. you request 100 cases and pay for all 100 upfront, before supplier delivers any)
  const totalDueForOrder = supplierSent * purchasePricePerContainer
  // YOUR debt (money) only exists when what you've paid is LESS than the value of what you requested.
  // If you've paid the same or more, you owe nothing (clamped at 0, never negative).
  const isFullyPaid = totalDueForOrder > 0 && totalPaid >= totalDueForOrder
  const balanceDue = Math.max(0, totalDueForOrder - totalPaid)
  const unpaidCases = Math.max(0, supplierSent - totalCasesPaid)

  // Cases the supplier still owes you (requested but not yet delivered) — independent of payment status.
  // This is what matters once you've paid: it tells you how many cases they still need to send you.
  const remainingToReceive = Math.max(0, supplierSent - receivedCases)
  const isFullyDelivered = supplierSent > 0 && remainingToReceive === 0
  // Monetary value of what the supplier still owes you in goods
  const supplierDebtValue = remainingToReceive * purchasePricePerContainer
  // Total value of the order you requested (useful to know how much you'll owe in total once fully delivered)
  const totalOrderValue = supplierSent * purchasePricePerContainer

  useEffect(() => {
    if (hasIssues) setShowBottleTracking(true)
    if (hasPartialCases) setShowPartialCases(true)
    if ((v.payments || []).length > 0) setShowPayments(true)
  }, [hasIssues, hasPartialCases, v.payments])

  // CRITICAL LOGIC: Update remaining to receive whenever supplierSent or received changes
  useEffect(() => {
    const newRemaining = Math.max(0, (v.supplierSent || 0) - (v.receivedCases || 0))
    setV(prev => ({
      ...prev,
      remainingToReceive: newRemaining
    }))
  }, [v.supplierSent, v.receivedCases])

  // When received cases changes, update remaining to receive
  const handleReceivedCasesChange = (value: number) => {
    const newReceived = Math.max(0, value)
    setV(prev => {
      const newRemaining = Math.max(0, (prev.supplierSent || 0) - newReceived)
      return {
        ...prev,
        receivedCases: newReceived,
        remainingToReceive: newRemaining,
        fullCases: newReceived // Received cases become your stock
      }
    })
  }

  // When the number of cases you requested changes, update remaining to receive
  const handleSupplierSentChange = (value: number) => {
    const newSent = Math.max(0, value)
    setV(prev => {
      const newRemaining = Math.max(0, newSent - (prev.receivedCases || 0))
      return {
        ...prev,
        supplierSent: newSent,
        remainingToReceive: newRemaining
      }
    })
  }

  // Handle category change
  useEffect(() => {
    if (isInitialized.current) return
    
    const config = getContainerConfig(v.category)
    
    setV(prev => ({
      ...prev,
      containerType: config.type,
      bottlesPerContainer: config.defaultBottlesPerContainer,
    }))
    
    isInitialized.current = true
  }, [v.category])

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

  const handleNumberChange = (setter: (value: number) => void, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    let num = parseFloat(cleanedValue)
    if (isNaN(num)) num = 0
    if (max !== undefined) num = Math.min(num, max)
    setter(num)
  }

  const handleIntegerChange = (setter: (value: number) => void, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const cleanedValue = cleanNumberInput(rawValue)
    let num = parseInt(cleanedValue)
    if (isNaN(num)) num = 0
    if (max !== undefined) num = Math.min(num, max)
    setter(num)
  }

  function addPartialCase() {
    if (newPartialCaseBottles <= 0 || newPartialCaseBottles >= BOTTLES_PER_CONTAINER) {
      toast.error(`Bottle count must be between 1 and ${BOTTLES_PER_CONTAINER - 1}`)
      return
    }

    if (v.fullCases === 0 && (v.partialCases || []).length === 0) {
      setErrors(prev => ({ ...prev, partialCases: `No full ${containerConfig.containerLabel.toLowerCase()}s available to open. Please add stock first.` }))
      return
    }

    const newPartialCase: PartialCase = {
      id: Date.now().toString(),
      bottleCount: newPartialCaseBottles,
      openedDate: new Date(),
      reason: newPartialCaseReason,
      notes: newPartialCaseNotes || undefined,
      containerType: v.containerType,
      sizeLabel: v.containerSizeLabel,
      bottleType: v.bottleType,
    }

    setV(prev => {
      const updatedPartialCases = [...(prev.partialCases || []), newPartialCase]
      const newFullCases = Math.max(0, prev.fullCases - 1)
      
      return {
        ...prev,
        partialCases: updatedPartialCases,
        fullCases: newFullCases,
      }
    })

    setNewPartialCaseBottles(Math.floor(BOTTLES_PER_CONTAINER / 2))
    setNewPartialCaseReason("sold_individual")
    setNewPartialCaseNotes("")
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.partialCases
      return newErrors
    })
    
    toast.success(`Opened new partial ${containerConfig.containerLabel.toLowerCase()} with ${newPartialCaseBottles} bottles`)
  }

  function removePartialCase(id: string) {
    setV(prev => {
      const removedCase = (prev.partialCases || []).find(pc => pc.id === id)
      if (!removedCase) return prev
      
      const newFullCases = prev.fullCases + 1
      
      return {
        ...prev,
        partialCases: (prev.partialCases || []).filter(pc => pc.id !== id),
        fullCases: newFullCases,
      }
    })
    toast.info("Partial container removed")
  }

  function updatePartialCaseBottles(id: string, newBottleCount: number) {
    if (newBottleCount <= 0 || newBottleCount >= BOTTLES_PER_CONTAINER) return
    setV(prev => ({
      ...prev,
      partialCases: (prev.partialCases || []).map(pc =>
        pc.id === id ? { ...pc, bottleCount: newBottleCount } : pc
      ),
    }))
  }

  // Auto-calculate how many cases a given payment amount covers, based on price per container
  function calculateCasesForAmount(amount: number): number {
    if (purchasePricePerContainer <= 0) return 0
    const maxCases = Math.max(0, supplierSent - totalCasesPaid)
    const cases = Math.round(amount / purchasePricePerContainer)
    return Math.min(Math.max(0, cases), maxCases)
  }

  // When the person types an amount, default the cases field to match — they can still edit it after
  function handlePaymentAmountChange(amount: number) {
    setPaymentAmount(amount)
    setPaymentCases(calculateCasesForAmount(amount))
  }

  // When the person types cases directly, fill in the matching amount so the payment isn't stuck at 0
  function handlePaymentCasesChange(cases: number) {
    const maxCases = Math.max(0, supplierSent - totalCasesPaid)
    const clampedCases = Math.min(Math.max(0, cases), maxCases)
    setPaymentCases(clampedCases)
    setPaymentAmount(Math.round(clampedCases * purchasePricePerContainer))
  }

  // Quick partial-payment buttons: 25% / 50% / 75% / 100% of the remaining balance
  function setPaymentByPercent(percent: number) {
    const amount = Math.round(balanceDue * percent)
    handlePaymentAmountChange(amount)
  }

  // Payment functions
  function addPayment() {
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0")
      return
    }

    if (paymentCases <= 0 || paymentCases > (v.supplierSent || 0)) {
      toast.error(`Payment must be for 1 to ${v.supplierSent || 0} cases (cases requested)`)
      return
    }

    const totalDue = (v.supplierSent || 0) * purchasePricePerContainer
    const newTotalPaid = totalPaid + paymentAmount
    
    if (newTotalPaid > totalDue) {
      toast.error(`Payment exceeds total due of ${formatCurrency(totalDue)}`)
      return
    }

    const newPayment: PaymentRecord = {
      id: Date.now().toString(),
      amount: paymentAmount,
      casesPaid: paymentCases,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    }

    setV(prev => ({
      ...prev,
      payments: [...(prev.payments || []), newPayment],
      totalPaid: totalPaid + paymentAmount,
      balanceDue: Math.max(0, totalDue - (totalPaid + paymentAmount)),
    }))

    // Reset payment form
    setPaymentAmount(0)
    setPaymentCases(0)
    setPaymentMethod("cash")
    setPaymentReference("")
    setPaymentNotes("")
    
    toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded for ${paymentCases} cases`)
  }

  // Mark the entire requested order as paid in one action, even if not all cases have arrived yet.
  // Records a payment for exactly the remaining balance so your debt becomes 0.
  function markAllAsPaid() {
    const totalDue = supplierSent * purchasePricePerContainer
    const remainingBalance = Math.max(0, totalDue - totalPaid)
    const remainingCases = Math.max(0, supplierSent - totalCasesPaid)

    if (remainingBalance <= 0 || remainingCases <= 0) {
      toast.info("Already fully paid — no balance remaining")
      return
    }

    const newPayment: PaymentRecord = {
      id: Date.now().toString(),
      amount: remainingBalance,
      casesPaid: remainingCases,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      notes: "Marked as fully paid",
    }

    setV(prev => ({
      ...prev,
      payments: [...(prev.payments || []), newPayment],
      totalPaid: totalPaid + remainingBalance,
      balanceDue: 0,
    }))

    toast.success(`Marked ${remainingCases} cases as paid (${formatCurrency(remainingBalance)}). Supplier still owes you ${remainingToReceive} cases if not yet delivered.`)
  }

  function removePayment(id: string) {
    const paymentToRemove = (v.payments || []).find(p => p.id === id)
    if (!paymentToRemove) return

    setV(prev => {
      const updatedPayments = (prev.payments || []).filter(p => p.id !== id)
      const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
      const totalDue = (prev.supplierSent || 0) * (prev.purchasePricePerContainer || 0)
      
      return {
        ...prev,
        payments: updatedPayments,
        totalPaid: newTotalPaid,
        balanceDue: Math.max(0, totalDue - newTotalPaid),
      }
    })
    
    toast.info("Payment record removed")
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!v.name.trim()) newErrors.name = "Product name is required"
    if (!v.brand.trim()) newErrors.brand = "Brand is required"
    if (v.fullCases < 0) newErrors.fullCases = `${containerConfig.containerLabel}s cannot be negative`
    
    if (containerConfig.allowEmptyBoxes && v.emptyCases < 0) {
      newErrors.emptyCases = `Empty ${containerConfig.containerLabel}s cannot be negative`
    }
    
    if ((v.purchasePricePerContainer ?? 0) < 0) newErrors.purchasePricePerContainer = "Purchase price cannot be negative"
    if ((v.sellingPricePerContainer ?? 0) < 0) newErrors.sellingPricePerContainer = "Selling price cannot be negative"
    if ((v.sellingPricePerContainer ?? 0) <= (v.purchasePricePerContainer ?? 0) && (v.sellingPricePerContainer ?? 0) > 0) {
      newErrors.sellingPricePerContainer = `Selling price per ${containerConfig.containerLabel.toLowerCase()} must be greater than purchase price`
    }
    if (!v.batchNumber.trim()) newErrors.batchNumber = "Batch number is required for tracking"
    if (BOTTLES_PER_CONTAINER <= 0) newErrors.bottlesPerContainer = "Bottles per container must be greater than 0"
    
    if (missingBottles + damagedBottles > totalCapacity) {
      newErrors.bottles = "Missing and damaged bottles cannot exceed total capacity"
    }
    if (missingBottles < 0 || damagedBottles < 0 || returnedBottles < 0) {
      newErrors.bottles = "Bottle counts cannot be negative"
    }

    // Validate supplier delivery fields
    if ((v.supplierSent || 0) < 0) {
      newErrors.supplierSent = "Requested cases cannot be negative"
    }
    
    if ((v.receivedCases || 0) < 0) {
      newErrors.receivedCases = "Received cases cannot be negative"
    }
    
    if (receivedCases > supplierSent) {
      newErrors.receivedCases = `Received cases (${receivedCases}) cannot exceed requested cases (${supplierSent})`
    }

    // Validate payment balance — payments can be made against the full requested order
    const totalDue = (v.supplierSent || 0) * (v.purchasePricePerContainer || 0)
    const paymentsTotal = (v.payments || []).reduce((sum, p) => sum + p.amount, 0)
    if (paymentsTotal > totalDue && totalDue > 0) {
      newErrors.payments = `Total payments (${formatCurrency(paymentsTotal)}) exceed total due (${formatCurrency(totalDue)})`
    }

    const dateError = validateDates(v.manufactureDate, v.expiryDate)
    if (dateError) newErrors.expiryDate = dateError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    // Calculate per-bottle prices
    const purchasePricePerBottle = BOTTLES_PER_CONTAINER > 0 
      ? (v.purchasePricePerContainer ?? 0) / BOTTLES_PER_CONTAINER 
      : 0
    const sellingPricePerBottle = BOTTLES_PER_CONTAINER > 0 
      ? (v.sellingPricePerContainer ?? 0) / BOTTLES_PER_CONTAINER 
      : 0

    // Ensure bottleInfo has notes field
    const bottleInfo = v.bottleInfo || {
      damaged: 0,
      missing: 0,
      returned: 0,
      notes: "",
    }

    // Calculate payment totals
    const paymentsTotal = (v.payments || []).reduce((sum, p) => sum + p.amount, 0)
    const finalRemainingToReceive = Math.max(0, (v.supplierSent || 0) - (v.receivedCases || 0))

    // Create complete product data with ALL fields
    const productData: ProductFormValues = {
      // Basic Information
      name: v.name,
      brand: v.brand,
      category: v.category,
      supplier: v.supplier,
      
      // Stock Information
      fullCases: v.fullCases,
      emptyCases: v.emptyCases,
      lowStockThreshold: v.lowStockThreshold,
      depositAmount: v.depositAmount,
      
      // Container Configuration
      containerType: v.containerType || containerConfig.type,
      containerSizeLabel: v.containerSizeLabel || (v.bottleType === "small" ? "Small" : "Grand"),
      bottlesPerContainer: v.bottlesPerContainer ?? 24,
      bottleType: v.bottleType || "grand",
      
      // Pricing (BOTH per container AND per bottle)
      purchasePricePerContainer: v.purchasePricePerContainer ?? 0,
      sellingPricePerContainer: v.sellingPricePerContainer ?? 0,
      purchasePrice: purchasePricePerBottle,
      sellingPrice: sellingPricePerBottle,
      
      // Bottle and Case Tracking
      bottleInfo: bottleInfo,
      partialCases: v.partialCases || [],
      lastStockCheck: new Date(),
      
      // Supplier Delivery Tracking (cases owed both directions)
      supplierSent: v.supplierSent || 0,
      receivedCases: v.receivedCases || 0,
      remainingToReceive: finalRemainingToReceive,
      supplierDebtValue: finalRemainingToReceive * (v.purchasePricePerContainer ?? 0),
      payments: v.payments || [],
      totalPaid: paymentsTotal,
      balanceDue: Math.max(0, ((v.supplierSent || 0) * (v.purchasePricePerContainer || 0)) - paymentsTotal),
      
      // Dates
      manufactureDate: new Date(v.manufactureDate).toISOString(),
      expiryDate: new Date(v.expiryDate).toISOString(),
      batchNumber: v.batchNumber,
    }

    console.log('Submitting product data:', {
      supplierSent: productData.supplierSent,
      receivedCases: productData.receivedCases,
      remainingToReceive: productData.remainingToReceive,
      supplierDebtValue: productData.supplierDebtValue,
      fullCases: productData.fullCases,
      payments: productData.payments,
      totalPaid: productData.totalPaid,
      balanceDue: productData.balanceDue,
    })
    
    onSubmit(productData)
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "sold_individual": return "Individual Sales"
      case "broken_container": return `Broken ${containerConfig.containerLabel}`
      case "sample": return "Sampling"
      default: return "Other"
    }
  }

  const getContainerIcon = () => {
    switch (v.category) {
      case "Liquor": return <Wine className="size-4" />
      case "Beer": return <Beer className="size-4" />
      case "Wine": return <Wine className="size-4" />
      default: return <Package className="size-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Cash"
      case "bank_transfer": return "Bank Transfer"
      case "mobile_money": return "Mobile Money"
      case "check": return "Check"
      default: return method
    }
  }

  const handleBottleTypeToggle = (type: "small" | "grand") => {
    setSelectedBottleType(type)
    setV(prev => ({
      ...prev,
      bottleType: type,
      containerSizeLabel: type === "small" ? "Small" : "Grand"
    }))
  }

  const handleBottlesPerContainerChange = (value: number) => {
    setV(prev => ({
      ...prev,
      bottlesPerContainer: value
    }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number): boolean => {
    const tempErrors: Record<string, string> = {}
    
    if (step === 0) {
      if (!v.name.trim()) tempErrors.name = "Required"
      if (!v.brand.trim()) tempErrors.brand = "Required"
      if (!v.supplier) tempErrors.supplier = "Required"
      return Object.keys(tempErrors).length === 0
    }
    
    if (step === 1) {
      if (v.fullCases < 0) tempErrors.fullCases = "Cannot be negative"
      if (containerConfig.allowEmptyBoxes && v.emptyCases < 0) {
        tempErrors.emptyCases = "Cannot be negative"
      }
      if ((v.bottlesPerContainer ?? 0) <= 0) {
        tempErrors.bottlesPerContainer = "Must be greater than 0"
      }
      return Object.keys(tempErrors).length === 0
    }
    
    if (step === 2) {
      if ((v.purchasePricePerContainer ?? 0) < 0) tempErrors.purchasePricePerContainer = "Cannot be negative"
      if ((v.sellingPricePerContainer ?? 0) < 0) tempErrors.sellingPricePerContainer = "Cannot be negative"
      return Object.keys(tempErrors).length === 0
    }
    
    if (step === 3) {
      if (!v.batchNumber.trim()) tempErrors.batchNumber = "Required"
      return Object.keys(tempErrors).length === 0
    }
    
    return true
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderStockDetails()
      case 2:
        return renderPricing()
      case 3:
        return renderTracking()
      default:
        return null
    }
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="name" 
            value={v.name} 
            autoComplete="off"
            placeholder="e.g., Hennessy VS"
            onChange={(e) => set("name", e.target.value)} 
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand" className="text-sm font-medium">
            Brand <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="brand" 
            value={v.brand} 
            autoComplete="off"
            placeholder="e.g., Hennessy"
            onChange={(e) => set("brand", e.target.value)} 
            className={cn(errors.brand && "border-destructive")}
          />
          {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Category <span className="text-destructive">*</span></Label>
          <Select value={v.category} onValueChange={(val) => {
            set("category", val)
            isInitialized.current = false
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  <div className="flex items-center gap-2">
                    {c === "Beer" && <Beer className="size-4" />}
                    {c === "Liquor" && <Wine className="size-4" />}
                    {c === "Wine" && <Wine className="size-4" />}
                    {c}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Supplier <span className="text-destructive">*</span></Label>
          <Select value={v.supplier} onValueChange={(val) => set("supplier", val)}>
            <SelectTrigger className="w-full">
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
      </div>

      <div className="rounded-lg bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="size-4" />
          <span>Selected category: <strong>{v.category}</strong></span>
          <Badge variant="outline" className="ml-auto">
            {containerConfig.type === "box" ? "📦 Box" : "📦 Case"} format
          </Badge>
        </div>
      </div>
    </div>
  )

  const renderStockDetails = () => (
    <div className="space-y-6">
      {/* Container Configuration */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          {getContainerIcon()}
          <span className="font-medium">Container Configuration</span>
          <Badge variant="outline" className="ml-auto">
            {BOTTLES_PER_CONTAINER} bottles/{containerConfig.containerLabel.toLowerCase()}
          </Badge>
        </div>
        
        <div className="mt-3 space-y-4">
          {/* Bottle Type Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-medium">Bottle Type:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedBottleType === "small" ? "default" : "outline"}
                size="sm"
                onClick={() => handleBottleTypeToggle("small")}
                className="gap-2"
              >
                <Ruler className="size-3" />
                Small
              </Button>
              <Button
                type="button"
                variant={selectedBottleType === "grand" ? "default" : "outline"}
                size="sm"
                onClick={() => handleBottleTypeToggle("grand")}
                className="gap-2"
              >
                <Ruler className="size-3" />
                Grand
              </Button>
            </div>
          </div>

          {/* Custom Bottle Count */}
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
            <Pencil className="size-4 text-primary" />
            <Label className="text-sm font-medium">Bottles per {containerConfig.containerLabel.toLowerCase()}:</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Enter number"
              autoComplete="off"
              value={BOTTLES_PER_CONTAINER === 0 ? '' : BOTTLES_PER_CONTAINER}
              onChange={(e) => {
                const cleaned = cleanNumberInput(e.target.value)
                const num = parseInt(cleaned)
                if (!isNaN(num) && num > 0) {
                  handleBottlesPerContainerChange(num)
                } else if (e.target.value === '') {
                  handleBottlesPerContainerChange(0)
                }
              }}
              className="w-[120px]"
            />
            <span className="text-sm text-muted-foreground">
              {selectedBottleType === "small" ? "Small" : "Grand"} bottles
            </span>
            {errors.bottlesPerContainer && (
              <span className="text-xs text-destructive">{errors.bottlesPerContainer}</span>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Delivery Tracking */}
      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center gap-2 mb-4">
          <Send className="size-4 text-blue-600" />
          <span className="font-medium text-blue-900 dark:text-blue-100">Supplier Delivery Tracking</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Supplier Sent - What you requested from supplier */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="supplierSent" className="text-sm font-medium flex items-center gap-1">
              <PackageCheck className="size-4 text-blue-600" />
              Cases Requested
            </Label>
            <Input
              id="supplierSent"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={v.supplierSent === 0 ? '' : v.supplierSent}
              onChange={(e) => {
                const cleaned = cleanNumberInput(e.target.value)
                const num = parseInt(cleaned)
                if (!isNaN(num)) {
                  handleSupplierSentChange(num)
                } else {
                  handleSupplierSentChange(0)
                }
              }}
              className={cn(errors.supplierSent && "border-destructive")}
            />
            {errors.supplierSent && <p className="text-xs text-destructive">{errors.supplierSent}</p>}
            <p className="text-xs text-muted-foreground">
              Total cases you ordered from the supplier (e.g. 100)
            </p>
          </div>
          
          {/* Received Cases - What you've received */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="receivedCases" className="text-sm font-medium flex items-center gap-1">
              <Package className="size-4 text-green-600" />
              Received Cases
            </Label>
            <Input
              id="receivedCases"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={v.receivedCases === 0 ? '' : v.receivedCases}
              onChange={(e) => {
                const cleaned = cleanNumberInput(e.target.value)
                const num = parseInt(cleaned)
                if (!isNaN(num)) {
                  handleReceivedCasesChange(num)
                } else {
                  handleReceivedCasesChange(0)
                }
              }}
              className={cn(errors.receivedCases && "border-destructive")}
            />
            {errors.receivedCases && <p className="text-xs text-destructive">{errors.receivedCases}</p>}
            <p className="text-xs text-muted-foreground">
              Cases actually delivered so far (e.g. 50)
            </p>
          </div>
          
          {/* Remaining to Receive - Auto-calculated (supplier's debt to you) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="remainingToReceive" className="text-sm font-medium flex items-center gap-1">
              <Clock className="size-4 text-orange-500" />
              Supplier Owes You
            </Label>
            <Input
              id="remainingToReceive"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={remainingToReceive === 0 ? '' : remainingToReceive}
              readOnly
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              {remainingToReceive > 0 
                ? `⚠️ ${remainingToReceive} cases still owed to you (worth ${formatCurrency(supplierDebtValue)})`
                : '✓ All requested cases delivered'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-100/50 dark:bg-blue-900/30 p-3">
            <div className="text-xs text-muted-foreground">Requested</div>
            <div className="font-semibold">{supplierSent} cases</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalOrderValue)}
            </div>
          </div>
          <div className="rounded-lg bg-green-100/50 dark:bg-green-900/30 p-3">
            <div className="text-xs text-muted-foreground">Received</div>
            <div className="font-semibold text-green-600">{receivedCases} cases</div>
            <div className="text-xs text-muted-foreground mt-1">
              {supplierSent > 0 
                ? `${Math.round((receivedCases / supplierSent) * 100)}% received`
                : '0%'}
            </div>
          </div>
          <div className="rounded-lg bg-orange-100/50 dark:bg-orange-900/30 p-3">
            <div className="text-xs text-muted-foreground">Supplier Owes You</div>
            <div className="font-semibold text-orange-600">{remainingToReceive} cases</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(supplierDebtValue)}
            </div>
          </div>
          <div className={cn("rounded-lg p-3", balanceDue > 0 ? "bg-red-100/50 dark:bg-red-900/30" : "bg-green-100/50 dark:bg-green-900/30")}>
            <div className="text-xs text-muted-foreground">You Owe Supplier</div>
            <div className={cn("font-semibold", balanceDue > 0 ? "text-red-600" : "text-green-600")}>
              {balanceDue > 0 ? formatCurrency(balanceDue) : "Paid in full"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              for {receivedCases} cases received
            </div>
          </div>
        </div>
      </Card>

      {/* Full Cases - Your current stock (Received cases) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full" className="text-sm font-medium">
            Full {containerConfig.containerLabel}s (In Stock) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={v.fullCases === 0 ? '' : v.fullCases}
            onChange={handleIntegerChange((val) => set("fullCases", Math.max(0, val)))}
            className={cn(errors.fullCases && "border-destructive")}
          />
          {errors.fullCases && <p className="text-xs text-destructive">{errors.fullCases}</p>}
          <p className="text-xs text-muted-foreground">
            {totalFromFullContainers} bottles total in stock
          </p>
          <p className="text-xs text-blue-600">
            ℹ️ This is the stock you currently have (received from supplier)
          </p>
        </div>
        
        {containerConfig.allowEmptyBoxes && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="empty" className="text-sm font-medium">
              Empty {containerConfig.containerLabel}s
            </Label>
            <Input
              id="empty"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={v.emptyCases === 0 ? '' : v.emptyCases}
              onChange={handleIntegerChange((val) => set("emptyCases", Math.max(0, val)))}
            />
            <p className="text-xs text-muted-foreground">
              Deposit: {formatCurrency(v.depositAmount * v.emptyCases)}
            </p>
          </div>
        )}
      </div>

      {/* Partial Cases Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowPartialCases(!showPartialCases)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Split className="size-4" />
          {showPartialCases ? "Hide partial containers" : "Manage partial containers"}
          {hasPartialCases && (
            <Badge variant="secondary" className="ml-auto">
              {(v.partialCases || []).length} open
            </Badge>
          )}
        </button>

        {showPartialCases && (
          <Card className="mt-3 p-4 space-y-4">
            {(v.partialCases || []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Open Containers</Label>
                {(v.partialCases || []).map(pc => (
                  <div key={pc.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{pc.bottleCount} bottles</Badge>
                        {pc.bottleType && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {pc.bottleType}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {getReasonLabel(pc.reason)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
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
                          if (!isNaN(num) && num > 0 && num < BOTTLES_PER_CONTAINER) {
                            updatePartialCaseBottles(pc.id, num)
                          }
                        }}
                        className="w-20"
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
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Open New {containerConfig.containerLabel}</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={Math.floor(BOTTLES_PER_CONTAINER / 2).toString()}
                    value={newPartialCaseBottles === 0 ? '' : newPartialCaseBottles}
                    onChange={(e) => {
                      const cleaned = cleanNumberInput(e.target.value)
                      const num = parseInt(cleaned)
                      if (!isNaN(num)) {
                        setNewPartialCaseBottles(Math.min(BOTTLES_PER_CONTAINER - 1, Math.max(1, num)))
                      } else {
                        setNewPartialCaseBottles(0)
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bottles (1-{BOTTLES_PER_CONTAINER - 1})
                  </p>
                </div>
                <div>
                  <Select value={newPartialCaseReason} onValueChange={(v: any) => setNewPartialCaseReason(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sold_individual">Individual Sales</SelectItem>
                      <SelectItem value="broken_container">Broken {containerConfig.containerLabel}</SelectItem>
                      <SelectItem value="sample">Sampling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="Notes (optional)"
                    autoComplete="off"
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
                disabled={v.fullCases === 0}
              >
                <Plus className="size-4 mr-1" />
                Open {containerConfig.containerLabel}
              </Button>
              {errors.partialCases && (
                <p className="text-xs text-destructive mt-2">{errors.partialCases}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Bottle Tracking */}
      <div>
        <button
          type="button"
          onClick={() => setShowBottleTracking(!showBottleTracking)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Beer className="size-4" />
          {showBottleTracking ? "Hide bottle tracking" : "Track individual bottles"}
          {hasIssues && (
            <Badge variant="destructive" className="ml-auto">
              Issues detected
            </Badge>
          )}
        </button>

        {showBottleTracking && (
          <Card className="mt-3 p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="missing" className="text-sm">Missing Bottles</Label>
                <Input
                  id="missing"
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="0"
                  value={missingBottles === 0 ? '' : missingBottles}
                  onChange={handleIntegerChange(
                    (val) => setBottleInfo("missing", Math.max(0, Math.min(totalCapacity, val))),
                    totalCapacity
                  )}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="damaged" className="text-sm">Damaged Bottles</Label>
                <Input
                  id="damaged"
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="0"
                  value={damagedBottles === 0 ? '' : damagedBottles}
                  onChange={handleIntegerChange(
                    (val) => setBottleInfo("damaged", Math.max(0, Math.min(totalCapacity - missingBottles, val))),
                    totalCapacity - missingBottles
                  )}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="returned" className="text-sm">Returned Bottles</Label>
                <Input
                  id="returned"
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="0"
                  value={returnedBottles === 0 ? '' : returnedBottles}
                  onChange={handleIntegerChange((val) => setBottleInfo("returned", Math.max(0, val)))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes" className="text-sm">Stock Notes</Label>
              <Textarea
                id="notes"
                placeholder="Record any issues, discrepancies, or important notes..."
                value={v.bottleInfo?.notes || ""}
                onChange={(e) => setBottleInfo("notes", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Total Capacity</div>
                <div className="font-semibold">{totalCapacity} bottles</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Available</div>
                <div className="font-semibold text-green-600">{availableBottles}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lost/Damaged</div>
                <div className="font-semibold text-destructive">{missingBottles + damagedBottles}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Integrity</div>
                <div className={cn("font-semibold", stockIntegrity < 90 ? "text-orange-500" : "text-green-600")}>
                  {Math.round(stockIntegrity)}%
                </div>
              </div>
            </div>

            {errors.bottles && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errors.bottles}</AlertDescription>
              </Alert>
            )}
          </Card>
        )}
      </div>
    </div>
  )

  const renderPricing = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchasePerContainer" className="text-sm font-medium">
            Purchase Price per {containerConfig.containerLabel} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RWF</span>
            <Input
              id="purchasePerContainer"
              type="text"
              autoComplete="off"
              inputMode="decimal"
              placeholder="0"
              value={(v.purchasePricePerContainer ?? 0) === 0 ? '' : v.purchasePricePerContainer}
              onChange={handleNumberChange((val) => set("purchasePricePerContainer", Math.max(0, val)))}
              className={cn("pl-12", errors.purchasePricePerContainer && "border-destructive")}
            />
          </div>
          {errors.purchasePricePerContainer && (
            <p className="text-xs text-destructive">{errors.purchasePricePerContainer}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Total order value ({supplierSent} requested): {formatCurrency(totalOrderValue)}
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="sellingPerContainer" className="text-sm font-medium">
            Selling Price per {containerConfig.containerLabel} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RWF</span>
            <Input
              id="sellingPerContainer"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={(v.sellingPricePerContainer ?? 0) === 0 ? '' : v.sellingPricePerContainer}
              onChange={handleNumberChange((val) => set("sellingPricePerContainer", Math.max(0, val)))}
              className={cn("pl-12", errors.sellingPricePerContainer && "border-destructive")}
            />
          </div>
          {errors.sellingPricePerContainer && (
            <p className="text-xs text-destructive">{errors.sellingPricePerContainer}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="deposit" className="text-sm font-medium">Deposit Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">RWF</span>
            <Input
              id="deposit"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={v.depositAmount === 0 ? '' : v.depositAmount}
              onChange={handleNumberChange((val) => set("depositAmount", Math.max(0, val)))}
              className="pl-12"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Per {containerConfig.containerLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Payments Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowPayments(!showPayments)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Receipt className="size-4" />
          {showPayments ? "Hide payment records" : "Manage payments"}
          {(v.payments || []).length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {(v.payments || []).length} payments
            </Badge>
          )}
        </button>

        {showPayments && (
          <Card className="mt-3 p-4 space-y-4">
            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Total Due ({supplierSent} requested)</div>
                <div className="font-semibold">
                  {formatCurrency(totalOrderValue)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Paid</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(totalPaid)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Balance Due</div>
                <div className={cn("font-semibold", balanceDue > 0 ? "text-orange-500" : "text-green-600")}>
                  {balanceDue > 0 ? formatCurrency(balanceDue) : "Paid in full"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cases Paid</div>
                <div className="font-semibold">{totalCasesPaid} / {supplierSent}</div>
              </div>
            </div>

            {isFullyPaid && remainingToReceive > 0 && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <Clock className="size-4 text-orange-500" />
                <AlertDescription className="text-orange-700 dark:text-orange-300">
                  You've paid in full. Supplier still owes you {remainingToReceive} {containerConfig.containerLabel.toLowerCase()}{remainingToReceive === 1 ? "" : "s"} not yet delivered (worth {formatCurrency(supplierDebtValue)}).
                </AlertDescription>
              </Alert>
            )}

            {/* Payment History */}
            {(v.payments || []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment History</Label>
                {(v.payments || []).map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatCurrency(p.amount)}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {p.casesPaid} cases
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getPaymentMethodLabel(p.paymentMethod)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(p.paymentDate).toLocaleDateString()}
                        {p.reference && ` • Ref: ${p.reference}`}
                        {p.notes && ` • ${p.notes}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => removePayment(p.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Payment */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Record Payment</Label>

              {balanceDue > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick pay:</span>
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentByPercent(pct)}
                    >
                      {pct === 1 ? "100%" : `${pct * 100}%`}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatCurrency(Math.round(balanceDue * pct))})
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              <div className="mt-2 grid gap-3 sm:grid-cols-4">
                <div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={paymentAmount === 0 ? '' : paymentAmount}
                    onChange={(e) => {
                      const cleaned = cleanNumberInput(e.target.value)
                      const num = parseFloat(cleaned)
                      handlePaymentAmountChange(isNaN(num) ? 0 : num)
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Payment amount</p>
                </div>
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Cases"
                    value={paymentCases === 0 ? '' : paymentCases}
                    onChange={(e) => {
                      const cleaned = cleanNumberInput(e.target.value)
                      const num = parseInt(cleaned)
                      handlePaymentCasesChange(isNaN(num) ? 0 : num)
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Type cases or amount — the other fills in</p>
                </div>
                <div>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Payment method</p>
                </div>
                <div>
                  <Input
                    placeholder="Reference"
                    autoComplete="off"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Reference (optional)</p>
                </div>
              </div>
              <div className="mt-2">
                <Input
                  placeholder="Payment notes (optional)"
                  autoComplete="off"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPayment}
                  disabled={paymentAmount <= 0 || paymentCases <= 0}
                >
                  <CreditCard className="size-4 mr-1" />
                  Record Payment
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={markAllAsPaid}
                  disabled={balanceDue <= 0}
                >
                  <Check className="size-4 mr-1" />
                  Mark all as paid ({formatCurrency(balanceDue)})
                </Button>
              </div>
              {errors.payments && (
                <p className="text-xs text-destructive mt-2">{errors.payments}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Overall Debt Summary — both directions */}
      <Card className="p-4 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="size-4 text-purple-600" />
          <span className="font-medium text-purple-900 dark:text-purple-100">Debt Summary</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={cn(
            "rounded-lg border p-3",
            isFullyDelivered ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-orange-200 bg-orange-50 dark:bg-orange-950/20"
          )}>
            <div className="text-xs text-muted-foreground">Supplier owes you</div>
            <div className={cn("font-semibold", isFullyDelivered ? "text-green-600" : "text-orange-600")}>
              {isFullyDelivered ? "Nothing — fully delivered" : `${remainingToReceive} ${containerConfig.containerLabel.toLowerCase()}${remainingToReceive === 1 ? "" : "s"} • ${formatCurrency(supplierDebtValue)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {remainingToReceive > 0
                ? `They still need to deliver ${remainingToReceive} of the ${supplierSent} cases you requested`
                : "All requested cases have been delivered"}
            </p>
          </div>
          <div className={cn(
            "rounded-lg border p-3",
            isFullyPaid || balanceDue === 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"
          )}>
            <div className="text-xs text-muted-foreground">You owe supplier</div>
            <div className={cn("font-semibold", isFullyPaid || balanceDue === 0 ? "text-green-600" : "text-red-600")}>
              {balanceDue > 0 ? formatCurrency(balanceDue) : "Nothing — fully paid"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {supplierSent} cases requested (worth {formatCurrency(totalOrderValue)}), you've paid {formatCurrency(totalPaid)}
              {isFullyPaid && remainingToReceive > 0 && " — paid in full, awaiting delivery"}
            </p>
          </div>
        </div>
      </Card>

      {(v.sellingPricePerContainer ?? 0) > 0 && (v.purchasePricePerContainer ?? 0) > 0 && (
        <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Profit Margin: {profitMarginPerContainer.toFixed(1)}%
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {formatCurrency((v.sellingPricePerContainer ?? 0) - (v.purchasePricePerContainer ?? 0))} per {containerConfig.containerLabel.toLowerCase()}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {formatCurrency((v.sellingPricePerContainer ?? 0) / BOTTLES_PER_CONTAINER)} per bottle
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  const renderTracking = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="batch" className="text-sm font-medium">
            Batch Number <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="batch" 
            value={v.batchNumber} 
            autoComplete="off"
            onChange={(e) => set("batchNumber", e.target.value)} 
            className={cn(errors.batchNumber && "border-destructive")}
            placeholder="e.g., BATCH-2024-001"
          />
          {errors.batchNumber && <p className="text-xs text-destructive">{errors.batchNumber}</p>}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="threshold" className="text-sm font-medium">
            Low Stock Threshold ({containerConfig.containerLabel}s)
          </Label>
          <Input
            id="threshold"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="40"
            value={v.lowStockThreshold === 0 ? '' : v.lowStockThreshold}
            onChange={handleIntegerChange((val) => set("lowStockThreshold", Math.max(0, val)))}
          />
          <p className="text-xs text-muted-foreground">
            Alert when below {v.lowStockThreshold} {containerConfig.containerLabel.toLowerCase()}s
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="mfg" className="text-sm font-medium">Manufacture Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="mfg"
              type="date"
              value={toDateInput(v.manufactureDate)}
              onChange={(e) => set("manufactureDate", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="exp" className="text-sm font-medium">
            Expiry Date <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="exp"
              type="date"
              value={toDateInput(v.expiryDate)}
              onChange={(e) => set("expiryDate", e.target.value)}
              className={cn("pl-10", errors.expiryDate && "border-destructive")}
            />
          </div>
          {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <Badge variant="secondary" className="text-xs">
              {STEPS[currentStep].label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (isStepValid(index) || index <= currentStep) {
                    setCurrentStep(index)
                  }
                }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all",
                  index === currentStep && "bg-primary text-primary-foreground",
                  index < currentStep && "bg-primary/20 text-primary",
                  index > currentStep && "bg-muted text-muted-foreground",
                  !isStepValid(index) && index > currentStep && "opacity-50 cursor-not-allowed"
                )}
                disabled={!isStepValid(index) && index > currentStep}
              >
                {index < currentStep ? <Check className="size-4" /> : index + 1}
              </button>
            ))}
          </div>
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-1.5" />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-3">
          {currentStep === STEPS.length - 1 ? (
            <Button type="submit" className="gap-2">
              <Check className="size-4" />
              {submitLabel}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="gap-2"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}