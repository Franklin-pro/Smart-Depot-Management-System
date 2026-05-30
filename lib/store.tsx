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
        if (s.customerId) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === s.customerId
                ? { ...c, pendingEmpties: c.pendingEmpties + expectedEmpties, totalPurchases: c.totalPurchases + total }
                : c,
            ),
          )
        }
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
    }
  }, [currentUser, ready, products, suppliers, customers, sales, expenses, users, activities, notifications])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
