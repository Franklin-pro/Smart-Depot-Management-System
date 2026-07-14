// lib/store.tsx
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
  isLoading: boolean
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
  
  // Product CRUD - Fixed return types
  addProduct: (p: any) => Promise<Product>  // Changed to accept any and return Product
  updateProduct: (id: string | number, p: Partial<Product>) => Promise<void>
  deleteProduct: (id: string | number) => Promise<void>
  
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer>
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
  addSale: (s: NewSale) => Promise<Sale>
  recordEmptyReturn: (customerId: string, qty: number) => Promise<void>
  addExpense: (e: Omit<Expense, "id" | "invoiceNumber">) => Promise<void>
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => Promise<void>
   addUser: (u: Omit<User, "id" | "createdAt">) => Promise<User>
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
  const [isLoading, setIsLoading] = useState(false)
  
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
      setCurrentUser(null)
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    fetchData()
  }, [ready, currentUser])

  async function fetchData() {
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
        return user
      }
      return null
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Logout function
  function logout() {
    persistUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('user')
    sessionStorage.removeItem('auth-data')
    
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
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

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

    // Check for low empty stock
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
    isLoading,
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
    // PRODUCT CRUD OPERATIONS - FIXED
    // ============================================
    async addProduct(p: any): Promise<Product> {
      try {
        console.log('📦 Store: Creating product with data:', p)
        
        // Ensure all fields are properly formatted
        const productData = {
          // Basic fields
          name: p.name,
          brand: p.brand,
          category: p.category,
          supplier: p.supplier || '',
          fullCases: p.fullCases || 0,
          emptyCases: p.emptyCases || 0,
          purchasePrice: p.purchasePrice || 0,
          sellingPrice: p.sellingPrice || 0,
          batchNumber: p.batchNumber || '',
          manufactureDate: p.manufactureDate || new Date().toISOString(),
          expiryDate: p.expiryDate || new Date().toISOString(),
          lowStockThreshold: p.lowStockThreshold || 40,
          depositAmount: p.depositAmount || 0,
          
          // Extended fields - CRITICAL FOR BOTTLE TRACKING
          bottleInfo: p.bottleInfo || {
            damaged: 0,
            missing: 0,
            returned: 0,
            notes: '',
          },
          partialCases: p.partialCases || [],
          lastStockCheck: p.lastStockCheck || new Date().toISOString(),
          containerType: p.containerType || 'case',
          containerSizeLabel: p.containerSizeLabel || 'Grand',
          bottleType: p.bottleType || 'grand',
          purchasePricePerContainer: p.purchasePricePerContainer || 0,
          sellingPricePerContainer: p.sellingPricePerContainer || 0,
          supplierSent: p.supplierSent || 0,
          receivedCases: p.receivedCases || 0,
          remainingToReceive: p.remainingToReceive || 0,
          supplierDebtValue: p.supplierDebtValue || 0,
          payments: p.payments || [],
          totalPaid: p.totalPaid || 0,
          balanceDue: p.balanceDue || 0,
        }
        
        console.log('📤 Store: Sending to API:', productData)
        
        const product = await productsService.create(productData)
        
        if (!product || !product.id) {
          throw new Error('Failed to create product: No product returned from API')
        }
        
        console.log('✅ Store: Product created successfully:', product)
        
        setProducts((prev) => [product, ...prev])
        pushActivity("stock", `${product.fullCases || 0} cases of ${product.name} added to inventory`)
        
        return product
      } catch (error) {
        console.error('❌ Store: Failed to add product:', error)
        throw error
      }
    },

    async updateProduct(id, patch) {
      try {
        console.log('📦 Store: Updating product:', id, patch)
        
        // Ensure we're preserving all fields
        const currentProduct = products.find(p => p.id === id)
        if (!currentProduct) {
          throw new Error(`Product with id ${id} not found`)
        }
        
        const updatedData = {
          ...currentProduct,
          ...patch,
          updatedAt: new Date().toISOString(),
        }
        
        const updated = await productsService.update(id.toString(), updatedData)
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
        pushActivity("stock", `${updated.name} updated`)
        
        console.log('✅ Store: Product updated successfully:', updated)
      } catch (error) {
        console.error('❌ Store: Failed to update product:', error)
        throw error
      }
    },

    async deleteProduct(id) {
      try {
        console.log('🗑️ Store: Deleting product:', id)
        await productsService.delete(id.toString())
        setProducts((prev) => prev.filter((p) => p.id !== id))
        pushActivity("stock", `Product deleted`)
        console.log('✅ Store: Product deleted successfully')
      } catch (error) {
        console.error('❌ Store: Failed to delete product:', error)
        throw error
      }
    },

    // ============================================
    // SALE OPERATIONS
    // ============================================
    async addSale(s: any) {
      try {
        const sale = await salesService.create(s)
        setSales((prev) => [sale, ...prev])
        
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
      } catch (error) {
        console.error('❌ Store: Failed to add sale:', error)
        throw error
      }
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
      try {
        const user = await usersService.create(u)
        setUsers((prev) => [user, ...prev])
        pushActivity("user", `New ${u.role} ${u.name} added`)
        return user
      } catch (error) {
        console.error('❌ Store: Failed to add user:', error)
        throw error
      }
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
    async addEmptyCaseTransaction(t: any) {
      const transaction = await emptyCaseTransactionsService.create(t)
      setEmptyCaseTransactions((prev) => [transaction, ...prev])
      pushActivity("empty", `Empty case transaction created for ${t.customerName || "Unknown"}`)
      
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
      
      const updatedCustomers = await customersService.getAll()
      setCustomers(updatedCustomers)
      
      const updatedAudits = await transactionAuditsService.getAll()
      setTransactionAudits(updatedAudits)
      
      pushActivity("empty", `${processedBy} processed ${returnQuantity} empty case return from ${transaction.customerName || "Unknown"}`)
    },

    async addSupplierReturn(s) {
      const supplierReturn = await supplierReturnsService.create(s)
      setSupplierReturns((prev) => [supplierReturn, ...prev])
      
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