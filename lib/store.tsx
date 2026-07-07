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
  isLoading: boolean // Changed from boolean | undefined to boolean
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
  login: (email: string, password: string) => Promise<User | null>
  logout: () => void
  refreshData: () => Promise<void>
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<void>
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer>
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
  addSale: (s: NewSale) => Promise<Sale>
  recordEmptyReturn: (customerId: string, qty: number) => Promise<void>
  addExpense: (e: Omit<Expense, "id" | "invoiceNumber">) => Promise<void>
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => Promise<void>
  addUser: (u: Omit<User, "id" | "createdAt">) => Promise<void>
  updateUser: (id: string, u: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  markNotificationsRead: (notificationIds?: string[]) => Promise<void>
  addEmptyCaseTransaction: (t: Omit<EmptyCaseTransaction, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmptyCaseTransaction: (id: string, t: Partial<EmptyCaseTransaction>) => Promise<void>
  processEmptyCaseReturn: (transactionId: string, returnQuantity: number, processedBy: string) => Promise<void>
  addSupplierReturn: (s: Omit<SupplierReturn, "id">) => Promise<void>
  addDamagedCase: (d: Omit<DamagedCase, "id">) => Promise<void>
  addTransactionAudit: (a: Omit<TransactionAudit, "id" | "performedAt">) => Promise<void>
  checkAndGenerateNotifications: () => void
  // Setters for data refresh
  setEmptyCaseTransactions: (data: EmptyCaseTransaction[] | ((prev: EmptyCaseTransaction[]) => EmptyCaseTransaction[])) => void
  setProducts: (data: Product[] | ((prev: Product[]) => Product[])) => void
  setCustomers: (data: Customer[] | ((prev: Customer[]) => Customer[])) => void
  setSupplierReturns: (data: SupplierReturn[] | ((prev: SupplierReturn[]) => SupplierReturn[])) => void
  setDamagedCases: (data: DamagedCase[] | ((prev: DamagedCase[]) => DamagedCase[])) => void
  setTransactionAudits: (data: TransactionAudit[] | ((prev: TransactionAudit[]) => TransactionAudit[])) => void
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
  const [isLoading, setIsLoading] = useState(false) // Always boolean, never undefined
  
  // Data states
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

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const user = JSON.parse(raw)
        setCurrentUser(user)
      }
    } catch {}
    setReady(true)
  }, [])

  // Fetch data only when user is authenticated
  useEffect(() => {
    if (!ready || !currentUser) return
    
    const token = localStorage.getItem('accessToken')
    if (!token) {
      // No token, clear user and redirect
      setCurrentUser(null)
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    fetchData()
  }, [ready, currentUser])

  async function fetchData() {
    // Don't fetch if not authenticated
    const token = localStorage.getItem('accessToken')
    if (!token || !currentUser) return

    setIsLoading(true)
    try {
      const [
        productsData,
        customersData,
        salesData,
        suppliersData,
        expensesData,
        usersData,
        activitiesData,
        notificationsData,
        emptyCaseData,
        supplierReturnsData,
        damagedCasesData,
        auditsData
      ] = await Promise.allSettled([
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

      // Only set data if the promise was fulfilled
      if (productsData.status === 'fulfilled') setProducts(productsData.value)
      if (customersData.status === 'fulfilled') setCustomers(customersData.value)
      if (salesData.status === 'fulfilled') setSales(salesData.value)
      if (suppliersData.status === 'fulfilled') setSuppliers(suppliersData.value)
      if (expensesData.status === 'fulfilled') setExpenses(expensesData.value)
      if (usersData.status === 'fulfilled') setUsers(usersData.value)
      if (activitiesData.status === 'fulfilled') setActivities(activitiesData.value)
      if (notificationsData.status === 'fulfilled') setNotifications(notificationsData.value)
      if (emptyCaseData.status === 'fulfilled') setEmptyCaseTransactions(emptyCaseData.value)
      if (supplierReturnsData.status === 'fulfilled') setSupplierReturns(supplierReturnsData.value)
      if (damagedCasesData.status === 'fulfilled') setDamagedCases(damagedCasesData.value)
      if (auditsData.status === 'fulfilled') setTransactionAudits(auditsData.value)

      // Check for notifications after data load
      setTimeout(() => checkAndGenerateNotifications(), 1000)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  // Login function
  async function login(email: string, password: string): Promise<User | null> {
    try {
      const response = await usersService.login(email, password)
      const user = response.user
      
      if (user) {
        persistUser(user)
        // Data will be fetched by the useEffect when currentUser changes
        return user
      }
      return null
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Logout function - clear everything
  function logout() {
    // Clear user state
    persistUser(null)
    
    // Clear tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('user')
    sessionStorage.removeItem('auth-data')
    
    // Clear all data
    setProducts([])
    setCustomers([])
    setSales([])
    setSuppliers([])
    setExpenses([])
    setUsers([])
    setActivities([])
    setNotifications([])
    setEmptyCaseTransactions([])
    setSupplierReturns([])
    setDamagedCases([])
    setTransactionAudits([])
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Refresh data function
  async function refreshData() {
    await fetchData()
  }

  function checkAndGenerateNotifications() {
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

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev])
    }
  }

  const value = useMemo<AppState>(() => ({
    currentUser,
    ready,
    isLoading, // This is always a boolean
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
    
    // Setters
    setEmptyCaseTransactions,
    setProducts,
    setCustomers,
    setSupplierReturns,
    setDamagedCases,
    setTransactionAudits,
    setSales,
    setSuppliers,
    setExpenses,
    setUsers,
    
    login,
    logout,
    refreshData,

    // ============================================
    // CUSTOMER CRUD OPERATIONS
    // ============================================
    async addCustomer(c) {
      const customer = await customersService.create(c)
      setCustomers((prev) => [customer, ...prev])
      pushActivity("customer", `New customer ${c.name} added`)
      return customer
    },

    async updateCustomer(id, patch) {
      const updated = await customersService.update(id, patch)
      setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
      pushActivity("customer", `Customer ${updated.name} updated`)
      return updated
    },

    async deleteCustomer(id) {
      const customer = customers.find(c => c.id === id)
      await customersService.delete(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      if (customer) {
        pushActivity("customer", `Customer ${customer.name} deleted`)
      }
    },

    // ============================================
    // PRODUCT CRUD OPERATIONS
    // ============================================
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

    // ============================================
    // SALE OPERATIONS
    // ============================================
    async addSale(s:any) {
      const sale = await salesService.create(s)
      setSales((prev) => [sale, ...prev])
      
      // Refresh products and customers
      const [updatedProducts, updatedCustomers, updatedTransactions] = await Promise.all([
        productsService.getAll(),
        customersService.getAll(),
        emptyCaseTransactionsService.getAll(),
      ])
      setProducts(updatedProducts)
      setCustomers(updatedCustomers)
      setEmptyCaseTransactions(updatedTransactions)
      
      const expectedEmpties = s.items.reduce((sum: number, i: SaleItem) => sum + i.quantity, 0)
      pushActivity("sale", `${s.cashier} sold ${expectedEmpties} cases to ${s.customerName}`)
      return sale
    },

    async recordEmptyReturn(customerId, qty) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, pendingEmpties: Math.max(0, c.pendingEmpties - qty) } : c)),
      )
      const cust = customers.find((c) => c.id === customerId)
      pushActivity("empty", `${cust?.name ?? "Customer"} returned ${qty} empty cases`)
    },

    // ============================================
    // EXPENSE OPERATIONS
    // ============================================
    async addExpense(e) {
      const expense = await expensesService.create(e)
      setExpenses((prev) => [expense, ...prev])
      pushActivity("expense", `${e.recordedBy} recorded expense ${e.title}`)
    },

    async updateExpense(id, patch) {
      const updated = await expensesService.update(id, patch)
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
    },

    async deleteExpense(id) {
      await expensesService.delete(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    },

    // ============================================
    // SUPPLIER OPERATIONS
    // ============================================
    async addSupplier(s) {
      const supplier = await suppliersService.create(s)
      setSuppliers((prev) => [supplier, ...prev])
      pushActivity("supplier", `New supplier ${s.name} added`)
    },

    // ============================================
    // USER OPERATIONS
    // ============================================
    async addUser(u) {
      const user = await usersService.create(u)
      setUsers((prev) => [user, ...prev])
      pushActivity("user", `New ${u.role} ${u.name} added`)
    },

    async updateUser(id, patch) {
      const updated = await usersService.update(id, patch)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    },

    async deleteUser(id) {
      await usersService.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    },

    // ============================================
    // NOTIFICATION OPERATIONS
    // ============================================
    async markNotificationsRead(notificationIds?: string[]) {
      await notificationsService.markRead(notificationIds)
      if (notificationIds) {
        setNotifications((prev) => 
          prev.map((n) => 
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    },

    // ============================================
    // EMPTY CASE TRANSACTION OPERATIONS
    // ============================================
    async addEmptyCaseTransaction(t:any) {
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

    async updateEmptyCaseTransaction(id, patch) {
      // This would be a PATCH API call
      setEmptyCaseTransactions((prev) => 
        prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
      )
    },

    async processEmptyCaseReturn(transactionId, returnQuantity, processedBy) {
      const transaction = await emptyCaseTransactionsService.processReturn(transactionId, { 
        returnQuantity, 
        processedBy 
      })
      setEmptyCaseTransactions((prev) => prev.map((t) => t.id === transactionId ? transaction : t))
      
      // Refresh customers
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

    checkAndGenerateNotifications,
  }), [
    currentUser, ready, isLoading, 
    products, suppliers, customers, sales, expenses, users, 
    activities, notifications, emptyCaseTransactions, 
    supplierReturns, damagedCases, transactionAudits
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}