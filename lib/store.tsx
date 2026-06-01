"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type {
  Product,
  Supplier,
  Customer,
  Sale,
  Expense,
  User,
  Activity,
  AppNotification,
  SaleItem,
  PaymentMethod,
  EmptyCaseTransaction,
  SupplierReturn,
  DamagedCase,
  TransactionAudit,
} from "./types"
import {
  seedUsers,
  seedSuppliers,
  seedProducts,
  seedCustomers,
  seedSales,
  seedExpenses,
  seedActivities,
  seedNotifications,
  seedEmptyCaseTransactions,
  seedSupplierReturns,
  seedDamagedCases,
  seedTransactionAudits,
} from "./mock-data"

type NewSale = {
  customerId?: string
  customerName: string
  items: SaleItem[]
  discount: number
  payment: PaymentMethod
  amountPaid: number
  cashier: string
}

type AppState = {
  currentUser: User | null
  ready: boolean
  products: Product[]
  suppliers: Supplier[]
  customers: Customer[]
  sales: Sale[]
  expenses: Expense[]
  users: User[]
  activities: Activity[]
  notifications: AppNotification[]
  emptyCaseTransactions: EmptyCaseTransaction[]
  supplierReturns: SupplierReturn[]
  damagedCases: DamagedCase[]
  transactionAudits: TransactionAudit[]
  login: (email: string, password: string) => User | null
  loginAs: (role: User["role"]) => void
  logout: () => void
  addProduct: (p: Omit<Product, "id" | "createdAt">) => void
  updateProduct: (id: string, p: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addSale: (s: NewSale) => Sale
  recordEmptyReturn: (customerId: string, qty: number) => void
  addExpense: (e: Omit<Expense, "id">) => void
  updateExpense: (id: string, e: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => void
  addUser: (u: Omit<User, "id" | "createdAt">) => void
  updateUser: (id: string, u: Partial<User>) => void
  markNotificationsRead: () => void
  addEmptyCaseTransaction: (t: Omit<EmptyCaseTransaction, "id" | "createdAt" | "updatedAt">) => void
  updateEmptyCaseTransaction: (id: string, t: Partial<EmptyCaseTransaction>) => void
  processEmptyCaseReturn: (transactionId: string, returnQuantity: number, processedBy: string) => void
  addSupplierReturn: (s: Omit<SupplierReturn, "id">) => void
  addDamagedCase: (d: Omit<DamagedCase, "id">) => void
  addTransactionAudit: (a: Omit<TransactionAudit, "id" | "performedAt">) => void
  checkAndGenerateNotifications: () => void
}

const AppContext = createContext<AppState | null>(null)

const STORAGE_KEY = "beerdepot.currentUser"
const uid = () => Math.random().toString(36).slice(2, 10)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>(seedProducts)
  const [suppliers, setSuppliers] = useState<Supplier[]>(seedSuppliers)
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers)
  const [sales, setSales] = useState<Sale[]>(seedSales)
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses)
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [activities, setActivities] = useState<Activity[]>(seedActivities)
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications)
  const [emptyCaseTransactions, setEmptyCaseTransactions] = useState<EmptyCaseTransaction[]>(seedEmptyCaseTransactions)
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>(seedSupplierReturns)
  const [damagedCases, setDamagedCases] = useState<DamagedCase[]>(seedDamagedCases)
  const [transactionAudits, setTransactionAudits] = useState<TransactionAudit[]>(seedTransactionAudits)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  function persistUser(u: User | null) {
    setCurrentUser(u)
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function pushActivity(type: Activity["type"], message: string) {
    setActivities((prev) => [{ id: uid(), type, message, createdAt: new Date().toISOString() }, ...prev])
  }

  const value = useMemo<AppState>(() => {
    return {
      currentUser,
      ready,
      products,
      suppliers,
      customers,
      sales,
      expenses,
      users,
      activities,
      notifications,
      emptyCaseTransactions,
      supplierReturns,
      damagedCases,
      transactionAudits,
      login(email) {
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.status === "active")
        if (found) persistUser(found)
        return found ?? null
      },
      loginAs(role) {
        const found = users.find((u) => u.role === role && u.status === "active")
        if (found) persistUser(found)
      },
      logout() {
        persistUser(null)
      },
      addProduct(p) {
        const product: Product = { ...p, id: uid(), createdAt: new Date().toISOString() }
        setProducts((prev) => [product, ...prev])
        pushActivity("stock", `${product.fullCases} cases of ${product.name} added to inventory`)
      },
      updateProduct(id, patch) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      },
      deleteProduct(id) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
      },
      addSale(s) {
        const subtotal = s.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
        const total = subtotal - s.discount
        const expectedEmpties = s.items.reduce((sum, i) => sum + i.quantity, 0)
        const sale: Sale = {
          id: uid(),
          receiptNo: `RCP-${1000 + sales.length + 1}`,
          customerId: s.customerId,
          customerName: s.customerName,
          items: s.items,
          paymentMethod: s.payment,
          invoiceNumber: `INV-${1000 + sales.length + 1}`,
          status: "completed",
          subtotal,
          discount: s.discount,
          total,
          payment: s.payment,
          amountPaid: s.amountPaid,
          change: Math.max(0, s.amountPaid - total),
          cashier: s.cashier,
          expectedEmpties,
          returnedEmpties: 0,
          createdAt: new Date().toISOString(),
        }
        setSales((prev) => [sale, ...prev])
        // reduce inventory and add empties expected
        setProducts((prev) =>
          prev.map((p) => {
            const item = s.items.find((i) => i.productId === p.id)
            if (!item) return p
            return { ...p, fullCases: Math.max(0, p.fullCases - item.quantity) }
          }),
        )
        // update customer pending empties + purchases
        let totalDepositValue = 0
        if (s.customerId) {
          s.items.forEach((item) => {
            const product = products.find((p) => p.id === item.productId)
            if (product) {
              totalDepositValue += item.quantity * product.depositAmount
            }
          })
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === s.customerId
                ? { 
                    ...c, 
                    pendingEmpties: c.pendingEmpties + expectedEmpties, 
                    totalPurchases: c.totalPurchases + total,
                    refundableDeposits: c.refundableDeposits + totalDepositValue,
                  }
                : c,
            ),
          )
        }
        // Create empty case transactions for each product
        s.items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId)
          if (product) {
            const transaction: EmptyCaseTransaction = {
              id: uid(),
              productId: item.productId,
              customerId: s.customerId,
              customerName: s.customerName,
              productName: product.name,
              transactionType: "sale",
              totalQuantity: item.quantity,
              returnedQuantity: 0,
              pendingQuantity: item.quantity,
              depositAmount: product.depositAmount,
              totalDepositValue: item.quantity * product.depositAmount,
              refundedAmount: 0,
              expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              status: "pending",
              createdBy: s.cashier,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            setEmptyCaseTransactions((prev) => [transaction, ...prev])
          }
        })
        pushActivity("sale", `${s.cashier} sold ${expectedEmpties} cases to ${s.customerName}`)
        return sale
      },
      recordEmptyReturn(customerId, qty) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, pendingEmpties: Math.max(0, c.pendingEmpties - qty) } : c)),
        )
        const cust = customers.find((c) => c.id === customerId)
        pushActivity("empty", `${cust?.name ?? "Customer"} returned ${qty} empty cases`)
      },
      addExpense(e) {
        const expense: Expense = { ...e, id: uid() }
        setExpenses((prev) => [expense, ...prev])
        pushActivity("expense", `${e.recordedBy} recorded expense ${e.title}`)
      },
      updateExpense(id, patch) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
      },
      deleteExpense(id) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      },
      addSupplier(s) {
        setSuppliers((prev) => [{ ...s, id: uid(), createdAt: new Date().toISOString() }, ...prev])
      },
      addUser(u) {
        setUsers((prev) => [{ ...u, id: uid(), createdAt: new Date().toISOString() }, ...prev])
        pushActivity("user", `New ${u.role} ${u.name} added`)
      },
      updateUser(id, patch) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      },
      markNotificationsRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      },
      addEmptyCaseTransaction(t) {
        const transaction: EmptyCaseTransaction = {
          ...t,
          id: uid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setEmptyCaseTransactions((prev) => [transaction, ...prev])
        pushActivity("empty", `Empty case transaction created for ${t.customerName || "Unknown"}`)
        
        // Add audit log
        const audit: TransactionAudit = {
          id: uid(),
          transactionId: transaction.id,
          transactionType: "empty_case",
          action: "created",
          newState: { status: transaction.status },
          performedBy: t.createdBy,
          performedAt: new Date().toISOString(),
          notes: "Initial transaction created",
        }
        setTransactionAudits((prev) => [audit, ...prev])
      },
      updateEmptyCaseTransaction(id, patch) {
        setEmptyCaseTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)))
      },
      processEmptyCaseReturn(transactionId, returnQuantity, processedBy) {
        const transaction = emptyCaseTransactions.find((t) => t.id === transactionId)
        if (!transaction) return

        const newReturnedQuantity = transaction.returnedQuantity + returnQuantity
        const newPendingQuantity = transaction.pendingQuantity - returnQuantity
        const newRefundedAmount = transaction.refundedAmount + (returnQuantity * transaction.depositAmount)
        
        const newStatus = newPendingQuantity === 0 ? "completed" : "partial"
        
        setEmptyCaseTransactions((prev) => prev.map((t) => 
          t.id === transactionId 
            ? {
                ...t,
                returnedQuantity: newReturnedQuantity,
                pendingQuantity: newPendingQuantity,
                refundedAmount: newRefundedAmount,
                status: newStatus,
                actualReturnDate: newPendingQuantity === 0 ? new Date().toISOString() : t.actualReturnDate,
                updatedAt: new Date().toISOString(),
              }
            : t
        ))

        // Update customer balance
        if (transaction.customerId) {
          setCustomers((prev) => prev.map((c) => 
            c.id === transaction.customerId 
              ? {
                  ...c,
                  pendingEmpties: Math.max(0, c.pendingEmpties - returnQuantity),
                  refundableDeposits: Math.max(0, c.refundableDeposits - (returnQuantity * transaction.depositAmount)),
                }
              : c
          ))
        }

        // Add audit log
        const audit: TransactionAudit = {
          id: uid(),
          transactionId,
          transactionType: "empty_case",
          action: "updated",
          previousState: { status: transaction.status, returnedQuantity: transaction.returnedQuantity },
          newState: { status: newStatus, returnedQuantity: newReturnedQuantity },
          performedBy: processedBy,
          performedAt: new Date().toISOString(),
          notes: `Processed return of ${returnQuantity} cases`,
        }
        setTransactionAudits((prev) => [audit, ...prev])

        pushActivity("empty", `${processedBy} processed ${returnQuantity} empty case return from ${transaction.customerName || "Unknown"}`)
      },
      addSupplierReturn(s) {
        const supplierReturn: SupplierReturn = { ...s, id: uid() }
        setSupplierReturns((prev) => [supplierReturn, ...prev])
        
        // Add audit log
        const audit: TransactionAudit = {
          id: uid(),
          transactionId: supplierReturn.id,
          transactionType: "supplier_return",
          action: "created",
          newState: { quantity: supplierReturn.quantity },
          performedBy: supplierReturn.receivedBy,
          performedAt: new Date().toISOString(),
          notes: "Supplier return recorded",
        }
        setTransactionAudits((prev) => [audit, ...prev])

        pushActivity("empty", `${supplierReturn.receivedBy} returned ${supplierReturn.quantity} cases to ${supplierReturn.supplierName}`)
      },
      addDamagedCase(d) {
        const damagedCase: DamagedCase = { ...d, id: uid() }
        setDamagedCases((prev) => [damagedCase, ...prev])
        
        // Add audit log
        const audit: TransactionAudit = {
          id: uid(),
          transactionId: damagedCase.id,
          transactionType: "damage_report",
          action: "created",
          newState: { quantity: damagedCase.quantity, damageCost: damagedCase.damageCost },
          performedBy: damagedCase.reportedBy,
          performedAt: new Date().toISOString(),
          notes: "Damaged case reported",
        }
        setTransactionAudits((prev) => [audit, ...prev])

        pushActivity("empty", `${damagedCase.reportedBy} reported ${damagedCase.quantity} damaged cases of ${damagedCase.productName}`)
      },
      addTransactionAudit(a) {
        const audit: TransactionAudit = { ...a, id: uid(), performedAt: new Date().toISOString() }
        setTransactionAudits((prev) => [audit, ...prev])
      },
      checkAndGenerateNotifications() {
        const newNotifications: AppNotification[] = []
        
        // Check for overdue returns
        const overdueTransactions = emptyCaseTransactions.filter(t => 
          t.status === "pending" && 
          t.expectedReturnDate && 
          new Date(t.expectedReturnDate) < new Date()
        )
        if (overdueTransactions.length > 0) {
          newNotifications.push({
            id: uid(),
            level: "urgent",
            title: "Overdue Returns",
            message: `${overdueTransactions.length} empty case returns are overdue`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        // Check for high pending deposits
        const highPendingCustomers = customers.filter(c => c.refundableDeposits > 100000)
        if (highPendingCustomers.length > 0) {
          newNotifications.push({
            id: uid(),
            level: "warning",
            title: "High Pending Deposits",
            message: `${highPendingCustomers.length} customers have pending deposits over 100,000 RWF`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        // Check for damaged cases
        if (damagedCases.length > 0) {
          const totalDamaged = damagedCases.reduce((sum, d) => sum + d.quantity, 0)
          newNotifications.push({
            id: uid(),
            level: "warning",
            title: "Damaged Cases",
            message: `${totalDamaged} damaged cases recorded`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        // Check for low empty stock (less than 20 cases)
        const lowEmptyStockProducts = products.filter(p => p.emptyCases < 20)
        if (lowEmptyStockProducts.length > 0) {
          newNotifications.push({
            id: uid(),
            level: "info",
            title: "Low Empty Stock",
            message: `${lowEmptyStockProducts.length} products have less than 20 empty cases`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        // Add new notifications
        if (newNotifications.length > 0) {
          setNotifications((prev) => [...newNotifications, ...prev])
        }
      },
    }
  }, [currentUser, ready, products, suppliers, customers, sales, expenses, users, activities, notifications, emptyCaseTransactions, transactionAudits, damagedCases])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
