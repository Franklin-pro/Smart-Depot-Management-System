export type Role = "owner" | "manager" | "cashier" | "storekeeper"

export type User = {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  status: "active" | "inactive"
  createdAt: string
}

export type StockStatus = "available" | "low" | "expiring" | "expired" | "damaged"

export type Product = {
  id: string
  name: string
  brand: string
  category: string
  fullCases: number
  emptyCases: number
  purchasePrice: number
  sellingPrice: number
  supplier: string
  batchNumber: string
  manufactureDate: string
  expiryDate: string
  lowStockThreshold: number
  createdAt: string
}

export type Supplier = {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  productsSupplied: number
  createdAt: string
}

export type Customer = {
  id: string
  name: string
  phone: string
  type: "retail" | "wholesale"
  pendingEmpties: number
  totalPurchases: number
  createdAt: string
}

export type PaymentMethod = "cash" | "mobile" | "card" | "bank"

export type SaleItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export type Sale = {
  id: string
  receiptNo: string
  customerId?: string
  customerName: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  payment: PaymentMethod
  amountPaid: number
  change: number
  cashier: string
  expectedEmpties: number
  returnedEmpties: number
  createdAt: string
}

export type ExpenseCategory =
  | "transport"
  | "salaries"
  | "electricity"
  | "fuel"
  | "rent"
  | "maintenance"
  | "internet"
  | "other"

export type Expense = {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  date: string
  note?: string
  recordedBy: string
}

export type Activity = {
  id: string
  type: "sale" | "stock" | "expense" | "empty" | "expiry" | "user"
  message: string
  createdAt: string
}

export type AppNotification = {
  id: string
  level: "info" | "warning" | "urgent"
  title: string
  message: string
  createdAt: string
  read: boolean
}
