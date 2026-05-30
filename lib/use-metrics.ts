"use client"

import { useMemo } from "react"
import { useApp } from "./store"
import { daysUntil, getStockStatus } from "./format"

export function useMetrics() {
  const { products, sales, expenses, customers } = useApp()

  return useMemo(() => {
    const totalFullCases = products.reduce((s, p) => s + p.fullCases, 0)
    const totalEmptyCases = products.reduce((s, p) => s + p.emptyCases, 0)
    const stockValue = products.reduce((s, p) => s + p.fullCases * p.sellingPrice, 0)

    const today = new Date().toDateString()
    const dailySales = sales
      .filter((s) => new Date(s.createdAt).toDateString() === today)
      .reduce((s, x) => s + x.total, 0)
    const monthlyRevenue = sales.reduce((s, x) => s + x.total, 0)
    const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0)

    const costOfGoods = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.items.reduce((cs, item) => {
          const p = products.find((pr) => pr.id === item.productId)
          return cs + (p ? p.purchasePrice * item.quantity : 0)
        }, 0)
      )
    }, 0)
    const grossProfit = monthlyRevenue - costOfGoods
    const netProfit = grossProfit - totalExpenses

    const expiringSoon = products.filter((p) => {
      const d = daysUntil(p.expiryDate)
      return d >= 0 && d <= 30
    })
    const expired = products.filter((p) => daysUntil(p.expiryDate) < 0)
    const lowStock = products.filter((p) => getStockStatus(p) === "low")

    const pendingEmpties = customers.reduce((s, c) => s + c.pendingEmpties, 0)
    const totalExpectedEmpties = sales.reduce((s, x) => s + x.expectedEmpties, 0)
    const totalReturnedEmpties = sales.reduce((s, x) => s + x.returnedEmpties, 0)
    const missingEmpties = Math.max(0, totalExpectedEmpties - totalReturnedEmpties)

    return {
      totalFullCases,
      totalEmptyCases,
      stockValue,
      dailySales,
      monthlyRevenue,
      totalExpenses,
      grossProfit,
      netProfit,
      expiringSoon,
      expired,
      lowStock,
      pendingEmpties,
      missingEmpties,
      totalExpectedEmpties,
      totalReturnedEmpties,
    }
  }, [products, sales, expenses, customers])
}
