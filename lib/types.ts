export type Role = "owner" | "manager" | "cashier" | "storekeeper" | "staff" | "admin"

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
  sellingPricePerContainer:number
  supplier: string
  batchNumber: string
  manufactureDate: string
  expiryDate: string
  lowStockThreshold: number
  depositAmount: number
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
  email: string
  address: string
  totalSpent: number
  type: "retail" | "wholesale"
  updatedAt: string
  totalTransactions: number
  pendingEmpties: number
  totalPurchases: number
  refundableDeposits: number
  unpaidBalance: number
  createdAt: string
  city:string
  notes:string
}

export type PaymentMethod = "cash" | "mobile" | "card" | "bank"

export type SaleItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  item?: [
    {
      product: {
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
        depositAmount: number
        createdAt: string
      }
    }
  ]
}

export type Sale = {
  id: string
  receiptNo: string
  customerId?: string
  customerName: string
  items: SaleItem[]
  subtotal: number
  discount: number
  isPartialPayment: boolean
  remainingBalance: number
  tax: number
  remainingEmptyCasesTotal: number
  totalDepositValue: number
  total: number
  payment: PaymentMethod
  amountPaid: number
  change: number
  cashier: string
  paymentMethod: PaymentMethod
  expectedEmpties: number
  returnedEmpties: number
  invoiceNumber: string
  status: "completed" | "pending"
  createdAt: string
}

export type ExpenseCategory =
  | "transport"
  | "salaries"
  | "electricity"
  | "fuel"
  | "rent"
  | "maintenance"
  | "supplier"
  | "internet"
  | "other"

export type Expense = {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  date: string
  note?: string
  status?:string
  recordedBy: string
  invoiceNumber: string
  supplierName?: string
  
}

export type Activity = {
  id: string
  type: "supplier" | "sale" | "stock" | "expense" | "empty" | "expiry" | "user" | "customer" | "return" | "adjustment" | "damage"
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

// Empty Case Management Types
export type EmptyCaseStatus = "pending" | "partial" | "completed" | "overdue" | "damaged" | "cancelled"

export type TransactionType = "sale" | "customer_return" | "supplier_return" | "adjustment"

export type EmptyCaseTransaction = {
  id: string
  productId: string
  customerId?: string
  customerName?: string
  transactionType: TransactionType
  totalQuantity: number
  returnedQuantity: number
  pendingQuantity: number
  depositAmount: number
  totalDepositValue: number
  refundedAmount: number
  expectedReturnDate?: string
  actualReturnDate?: string
  productName: string
  status: EmptyCaseStatus
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type SupplierReturn = {
  id: string
  supplierId: string
  supplierName: string
  productId: string
  productName: string
  quantity: number
  receiptNumber: string
  returnedDate: string
  receivedBy: string
  notes?: string
}

export type DamagedCase = {
  id: string
  productId: string
  productName: string
  quantity: number
  reason: string
  damageCost: number
  reportedDate: string
  reportedBy: string
  notes?: string
}

export type TransactionAudit = {
  id: string
  transactionId: string
  transactionType: "empty_case" | "supplier_return" | "damage_report"
  action: "created" | "updated" | "deleted" | "processed"
  previousState?: any
  newState?: any
  performedBy: string
  performedAt: string
  notes?: string
}
