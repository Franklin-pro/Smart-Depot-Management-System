import type { Product, StockStatus } from "./types"

export function formatCurrency(amount: number) {
  // Check if amount is valid
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'RWF 0'
  }

  // Format with RWF currency code
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    currencyDisplay: "code", // This will show RWF instead of RF
    maximumFractionDigits: 0,
  }).format(amount).replace('RWF', 'RWF ') // Ensure there's a space after RWF
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function daysUntil(iso: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function getStockStatus(product: Product): StockStatus {
  const remaining = daysUntil(product.expiryDate)
  if (remaining < 0) return "expired"
  if (product.fullCases <= 0) return "damaged"
  if (remaining <= 30) return "expiring"
  if (product.fullCases <= product.lowStockThreshold) return "low"
  return "available"
}

export function expiryLevel(iso: string): "safe" | "expiring" | "warning" | "expired" {
  const d = daysUntil(iso)
  if (d < 0) return "expired"
  if (d <= 7) return "warning"
  if (d <= 30) return "expiring"
  return "safe"
}

export const statusLabels: Record<StockStatus, string> = {
  available: "Available",
  low: "Low Stock",
  expiring: "Expiring Soon",
  expired: "Expired",
  damaged: "Damaged",
}
