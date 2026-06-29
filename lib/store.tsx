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
  productsService,
  customersService,
  salesService,
  suppliersService,
  expensesService,
  usersService,
  activitiesService,
  notificationsService,
  emptyCaseTransactionsService,
  supplierReturnsService,
  damagedCasesService,
  transactionAuditsService,
  type NewSale,
} from "@/services"

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
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<void>
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addSale: (s: NewSale) => Promise<Sale>
  recordEmptyReturn: (customerId: string, qty: number) => void
  addExpense: (e: Omit<Expense, "id">) => Promise<void>
  updateExpense: (id: string, e: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => Promise<void>
  addUser: (u: Omit<User, "id" | "createdAt">) => Promise<void>
  updateUser: (id: string, u: Partial<User>) => void
  deleteUser: (id: string) => void;
  markNotificationsRead: () => Promise<void>
  addEmptyCaseTransaction: (t: Omit<EmptyCaseTransaction, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmptyCaseTransaction: (id: string, t: Partial<EmptyCaseTransaction>) => void
  processEmptyCaseReturn: (transactionId: string, returnQuantity: number, processedBy: string) => Promise<void>
  addSupplierReturn: (s: Omit<SupplierReturn, "id">) => Promise<void>
  addDamagedCase: (d: Omit<DamagedCase, "id">) => Promise<void>
  addTransactionAudit: (a: Omit<TransactionAudit, "id" | "performedAt">) => Promise<void>
  checkAndGenerateNotifications: () => void
  // ✅ Expose setter functions for data refresh
  setEmptyCaseTransactions: (data: EmptyCaseTransaction[] | ((prev: EmptyCaseTransaction[]) => EmptyCaseTransaction[])) => void
  setProducts: (data: Product[] | ((prev: Product[]) => Product[])) => void
  setCustomers: (data: Customer[] | ((prev: Customer[]) => Customer[])) => void
  setSupplierReturns: (data: SupplierReturn[] | ((prev: SupplierReturn[]) => SupplierReturn[])) => void
  setDamagedCases: (data: DamagedCase[] | ((prev: DamagedCase[]) => DamagedCase[])) => void
  setTransactionAudits: (data: TransactionAudit[] | ((prev: TransactionAudit[]) => TransactionAudit[])) => void
  // ✅ ADD THESE - Missing setters
  setSales: (data: Sale[] | ((prev: Sale[]) => Sale[])) => void
  setSuppliers: (data: Supplier[] | ((prev: Supplier[]) => Supplier[])) => void
  setExpenses: (data: Expense[] | ((prev: Expense[]) => Expense[])) => void
  setUsers: (data: User[] | ((prev: User[]) => User[])) => void
}

const AppContext = createContext<AppState | null>(null)

const STORAGE_KEY = "beerdepot.currentUser"
const uid = () => Math.random().toString(36).slice(2, 10)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [emptyCaseTransactions, setEmptyCaseTransactions] = useState<EmptyCaseTransaction[]>([])
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([])
  const [damagedCases, setDamagedCases] = useState<DamagedCase[]>([])
  const [transactionAudits, setTransactionAudits] = useState<TransactionAudit[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  // Fetch initial data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, customersData, salesData, suppliersData, expensesData, usersData, activitiesData, notificationsData, emptyCaseData, supplierReturnsData, damagedCasesData, auditsData] = await Promise.all([
          productsService.getAll(),
          customersService.getAll(),
          salesService.getAll(),
          suppliersService.getAll(),
          expensesService.getAll(),
          usersService.getAll(),
          activitiesService.getAll(),
          notificationsService.getAll(),
          emptyCaseTransactionsService.getAll(),
          supplierReturnsService.getAll(),
          damagedCasesService.getAll(),
          transactionAuditsService.getAll(),
        ])
        setProducts(productsData)
        setCustomers(customersData)
        setSales(salesData)
        setSuppliers(suppliersData)
        setExpenses(expensesData)
        setUsers(usersData)
        setActivities(activitiesData)
        setNotifications(notificationsData)
        setEmptyCaseTransactions(emptyCaseData)
        setSupplierReturns(supplierReturnsData)
        setDamagedCases(damagedCasesData)
        setTransactionAudits(auditsData)
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    fetchData()
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
      // ✅ Expose setter functions
      setEmptyCaseTransactions,
      setProducts,
      setCustomers,
      setSupplierReturns,
      setDamagedCases,
      setTransactionAudits,
      // ✅ ADD THESE - Missing setters
      setSales,
      setSuppliers,
      setExpenses,
      setUsers,
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
      async addProduct(p) {
        const product = await productsService.create(p)
        setProducts((prev) => [product, ...prev])
        pushActivity("stock", `${product.fullCases} cases of ${product.name} added to inventory`)
      },
      async updateProduct(id, patch) {
        const updated = await productsService.update(id, patch)
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      },
      async deleteProduct(id) {
        await productsService.delete(id)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      },
      async addSale(s) {
        const sale = await salesService.create(s)
        setSales((prev) => [sale, ...prev])
        
        // Refresh products and customers to get updated data from API
        const [updatedProducts, updatedCustomers] = await Promise.all([
          productsService.getAll(),
          customersService.getAll(),
        ])
        setProducts(updatedProducts)
        setCustomers(updatedCustomers)
        
        // Refresh empty case transactions
        const updatedTransactions = await emptyCaseTransactionsService.getAll()
        setEmptyCaseTransactions(updatedTransactions)
        
        const expectedEmpties = s.items.reduce((sum: number, i: SaleItem) => sum + i.quantity, 0)
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
      async addExpense(e) {
        const expense = await expensesService.create(e)
        setExpenses((prev) => [expense, ...prev])
        pushActivity("expense", `${e.recordedBy} recorded expense ${e.title}`)
      },
      updateExpense(id, patch) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
      },
      deleteExpense(id) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      },
      async addSupplier(s) {
        const supplier = await suppliersService.create(s)
        setSuppliers((prev) => [supplier, ...prev])
        pushActivity("supplier", `New supplier ${s.name} added`)
      },
      async addUser(u) {
        const user = await usersService.create(u)
        setUsers((prev) => [user, ...prev])
        pushActivity("user", `New ${u.role} ${u.name} added`)
      },
      updateUser(id, patch) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      },
      deleteUser(id) {
        setUsers((prev) => prev.filter((u) => u.id !== id))
      },
      async markNotificationsRead() {
        await notificationsService.markRead()
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      },
      async addEmptyCaseTransaction(t) {
        const transaction = await emptyCaseTransactionsService.create(t)
        setEmptyCaseTransactions((prev) => [transaction, ...prev])
        pushActivity("empty", `Empty case transaction created for ${t.customerName || "Unknown"}`)
        
        // Add audit log
        const audit = await transactionAuditsService.create({
          transactionId: transaction.id,
          transactionType: "empty_case",
          action: "created",
          newState: { status: transaction.status },
          performedBy: t.createdBy,
          notes: "Initial transaction created",
        })
        setTransactionAudits((prev) => [audit, ...prev])
      },
      updateEmptyCaseTransaction(id, patch) {
        setEmptyCaseTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)))
      },
      async processEmptyCaseReturn(transactionId, returnQuantity, processedBy) {
        const transaction = await emptyCaseTransactionsService.processReturn(transactionId, { returnQuantity, processedBy })
        setEmptyCaseTransactions((prev) => prev.map((t) => t.id === transactionId ? transaction : t))
        
        // Refresh customers to get updated data
        const updatedCustomers = await customersService.getAll()
        setCustomers(updatedCustomers)
        
        // Refresh audits
        const updatedAudits = await transactionAuditsService.getAll()
        setTransactionAudits(updatedAudits)
        
        pushActivity("empty", `${processedBy} processed ${returnQuantity} empty case return from ${transaction.customerName || "Unknown"}`)
      },
      async addSupplierReturn(s) {
        const supplierReturn = await supplierReturnsService.create(s)
        setSupplierReturns((prev) => [supplierReturn, ...prev])
        
        // Add audit log
        const audit = await transactionAuditsService.create({
          transactionId: supplierReturn.id,
          transactionType: "supplier_return",
          action: "created",
          newState: { quantity: supplierReturn.quantity },
          performedBy: supplierReturn.receivedBy,
          notes: "Supplier return recorded",
        })
        setTransactionAudits((prev) => [audit, ...prev])

        pushActivity("empty", `${supplierReturn.receivedBy} returned ${supplierReturn.quantity} cases to ${supplierReturn.supplierName}`)
      },
      async addDamagedCase(d) {
        const damagedCase = await damagedCasesService.create(d)
        setDamagedCases((prev) => [damagedCase, ...prev])
        
        // Add audit log
        const audit = await transactionAuditsService.create({
          transactionId: damagedCase.id,
          transactionType: "damage_report",
          action: "created",
          newState: { quantity: damagedCase.quantity, damageCost: damagedCase.damageCost },
          performedBy: damagedCase.reportedBy,
          notes: "Damaged case reported",
        })
        setTransactionAudits((prev) => [audit, ...prev])

        pushActivity("empty", `${damagedCase.reportedBy} reported ${damagedCase.quantity} damaged cases of ${damagedCase.productName}`)
      },
      async addTransactionAudit(a) {
        const audit = await transactionAuditsService.create(a)
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
  }, [currentUser, ready, products, suppliers, customers, sales, expenses, users, activities, notifications, emptyCaseTransactions, transactionAudits, damagedCases, supplierReturns])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}