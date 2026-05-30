import type {
  Product,
  Supplier,
  Customer,
  Sale,
  Expense,
  User,
  Activity,
  AppNotification,
} from "./types"

const today = new Date()
function daysFromNow(d: number) {
  const date = new Date(today)
  date.setDate(date.getDate() + d)
  return date.toISOString()
}

export const seedUsers: User[] = [
  { id: "u1", name: "Jean Bosco", email: "owner@beerdepot.com", role: "owner", phone: "+250 788 100 100", status: "active", createdAt: daysFromNow(-400) },
  { id: "u2", name: "Aline Uwase", email: "manager@beerdepot.com", role: "manager", phone: "+250 788 200 200", status: "active", createdAt: daysFromNow(-300) },
  { id: "u3", name: "Eric Mugisha", email: "cashier@beerdepot.com", role: "cashier", phone: "+250 788 300 300", status: "active", createdAt: daysFromNow(-200) },
  { id: "u4", name: "Claude Niyonzima", email: "store@beerdepot.com", role: "storekeeper", phone: "+250 788 400 400", status: "active", createdAt: daysFromNow(-150) },
  { id: "u5", name: "Diane Keza", email: "cashier2@beerdepot.com", role: "cashier", phone: "+250 788 500 500", status: "inactive", createdAt: daysFromNow(-90) },
]

export const seedSuppliers: Supplier[] = [
  { id: "s1", name: "Bralirwa Ltd", contact: "Patrick H.", phone: "+250 788 111 222", email: "sales@bralirwa.rw", productsSupplied: 4, createdAt: daysFromNow(-365) },
  { id: "s2", name: "Skol Brewery", contact: "Marie C.", phone: "+250 788 333 444", email: "orders@skol.rw", productsSupplied: 3, createdAt: daysFromNow(-300) },
  { id: "s3", name: "East African Distributors", contact: "Samuel O.", phone: "+250 788 555 666", email: "info@ead.co", productsSupplied: 2, createdAt: daysFromNow(-200) },
]

export const seedProducts: Product[] = [
  { id: "p1", name: "Primus", brand: "Bralirwa", category: "Lager", fullCases: 320, emptyCases: 210, purchasePrice: 9000, sellingPrice: 11000, supplier: "Bralirwa Ltd", batchNumber: "BR-2024-001", manufactureDate: daysFromNow(-40), expiryDate: daysFromNow(25), lowStockThreshold: 50, createdAt: daysFromNow(-40) },
  { id: "p2", name: "Mutzig", brand: "Bralirwa", category: "Premium Lager", fullCases: 180, emptyCases: 140, purchasePrice: 11000, sellingPrice: 13500, supplier: "Bralirwa Ltd", batchNumber: "BR-2024-002", manufactureDate: daysFromNow(-20), expiryDate: daysFromNow(120), lowStockThreshold: 40, createdAt: daysFromNow(-20) },
  { id: "p3", name: "Turbo King", brand: "Bralirwa", category: "Stout", fullCases: 8, emptyCases: 30, purchasePrice: 12000, sellingPrice: 15000, supplier: "Bralirwa Ltd", batchNumber: "BR-2024-003", manufactureDate: daysFromNow(-90), expiryDate: daysFromNow(-2), lowStockThreshold: 30, createdAt: daysFromNow(-90) },
  { id: "p4", name: "Skol Lager", brand: "Skol", category: "Lager", fullCases: 240, emptyCases: 180, purchasePrice: 8500, sellingPrice: 10500, supplier: "Skol Brewery", batchNumber: "SK-2024-010", manufactureDate: daysFromNow(-30), expiryDate: daysFromNow(60), lowStockThreshold: 50, createdAt: daysFromNow(-30) },
  { id: "p5", name: "Skol Gatanu", brand: "Skol", category: "Strong Lager", fullCases: 35, emptyCases: 60, purchasePrice: 13000, sellingPrice: 16000, supplier: "Skol Brewery", batchNumber: "SK-2024-011", manufactureDate: daysFromNow(-50), expiryDate: daysFromNow(10), lowStockThreshold: 40, createdAt: daysFromNow(-50) },
  { id: "p6", name: "Heineken", brand: "Heineken", category: "Premium Lager", fullCases: 95, emptyCases: 70, purchasePrice: 18000, sellingPrice: 22000, supplier: "East African Distributors", batchNumber: "HK-2024-005", manufactureDate: daysFromNow(-15), expiryDate: daysFromNow(200), lowStockThreshold: 30, createdAt: daysFromNow(-15) },
  { id: "p7", name: "Guinness", brand: "Diageo", category: "Stout", fullCases: 60, emptyCases: 45, purchasePrice: 19000, sellingPrice: 24000, supplier: "East African Distributors", batchNumber: "GN-2024-007", manufactureDate: daysFromNow(-25), expiryDate: daysFromNow(40), lowStockThreshold: 25, createdAt: daysFromNow(-25) },
  { id: "p8", name: "Amstel", brand: "Heineken", category: "Lager", fullCases: 20, emptyCases: 15, purchasePrice: 16000, sellingPrice: 20000, supplier: "Skol Brewery", batchNumber: "AM-2024-009", manufactureDate: daysFromNow(-60), expiryDate: daysFromNow(5), lowStockThreshold: 30, createdAt: daysFromNow(-60) },
]

export const seedCustomers: Customer[] = [
  { id: "c1", name: "Kigali Bar & Lounge", phone: "+250 788 010 010", type: "wholesale", pendingEmpties: 5, totalPurchases: 1450000, createdAt: daysFromNow(-200) },
  { id: "c2", name: "Nyamirambo Club", phone: "+250 788 020 020", type: "wholesale", pendingEmpties: 12, totalPurchases: 980000, createdAt: daysFromNow(-150) },
  { id: "c3", name: "Walk-in Customer", phone: "-", type: "retail", pendingEmpties: 0, totalPurchases: 320000, createdAt: daysFromNow(-100) },
  { id: "c4", name: "Remera Restaurant", phone: "+250 788 030 030", type: "wholesale", pendingEmpties: 8, totalPurchases: 760000, createdAt: daysFromNow(-80) },
]

export const seedSales: Sale[] = [
  { id: "sale1", receiptNo: "RCP-1001", customerId: "c1", customerName: "Kigali Bar & Lounge", items: [{ productId: "p1", name: "Primus", quantity: 20, unitPrice: 11000 }], subtotal: 220000, discount: 0, total: 220000, payment: "mobile", amountPaid: 220000, change: 0, cashier: "Eric Mugisha", expectedEmpties: 20, returnedEmpties: 15, createdAt: daysFromNow(-1) },
  { id: "sale2", receiptNo: "RCP-1002", customerId: "c2", customerName: "Nyamirambo Club", items: [{ productId: "p4", name: "Skol Lager", quantity: 15, unitPrice: 10500 }, { productId: "p6", name: "Heineken", quantity: 5, unitPrice: 22000 }], subtotal: 267500, discount: 7500, total: 260000, payment: "cash", amountPaid: 300000, change: 40000, cashier: "Eric Mugisha", expectedEmpties: 20, returnedEmpties: 8, createdAt: daysFromNow(-1) },
  { id: "sale3", receiptNo: "RCP-1003", customerId: "c3", customerName: "Walk-in Customer", items: [{ productId: "p2", name: "Mutzig", quantity: 3, unitPrice: 13500 }], subtotal: 40500, discount: 0, total: 40500, payment: "card", amountPaid: 40500, change: 0, cashier: "Diane Keza", expectedEmpties: 3, returnedEmpties: 3, createdAt: daysFromNow(0) },
  { id: "sale4", receiptNo: "RCP-1004", customerId: "c4", customerName: "Remera Restaurant", items: [{ productId: "p7", name: "Guinness", quantity: 8, unitPrice: 24000 }], subtotal: 192000, discount: 2000, total: 190000, payment: "bank", amountPaid: 190000, change: 0, cashier: "Eric Mugisha", expectedEmpties: 8, returnedEmpties: 0, createdAt: daysFromNow(0) },
]

export const seedExpenses: Expense[] = [
  { id: "e1", title: "Delivery truck fuel", category: "fuel", amount: 85000, date: daysFromNow(-2), note: "Weekly refill", recordedBy: "Aline Uwase" },
  { id: "e2", title: "Staff salaries", category: "salaries", amount: 1200000, date: daysFromNow(-5), recordedBy: "Jean Bosco" },
  { id: "e3", title: "Electricity bill", category: "electricity", amount: 145000, date: daysFromNow(-7), recordedBy: "Aline Uwase" },
  { id: "e4", title: "Warehouse rent", category: "rent", amount: 600000, date: daysFromNow(-10), recordedBy: "Jean Bosco" },
  { id: "e5", title: "Transport to depot", category: "transport", amount: 55000, date: daysFromNow(-3), recordedBy: "Claude Niyonzima" },
  { id: "e6", title: "Internet subscription", category: "internet", amount: 45000, date: daysFromNow(-12), recordedBy: "Aline Uwase" },
  { id: "e7", title: "Cooler maintenance", category: "maintenance", amount: 75000, date: daysFromNow(-6), recordedBy: "Claude Niyonzima" },
]

export const seedActivities: Activity[] = [
  { id: "a1", type: "sale", message: "Eric sold 20 cases of Primus to Kigali Bar & Lounge", createdAt: daysFromNow(-1) },
  { id: "a2", type: "stock", message: "Claude added 100 cases of Skol Lager", createdAt: daysFromNow(-1) },
  { id: "a3", type: "expiry", message: "Turbo King batch BR-2024-003 marked expired", createdAt: daysFromNow(0) },
  { id: "a4", type: "empty", message: "Nyamirambo Club returned 8 empty cases", createdAt: daysFromNow(0) },
  { id: "a5", type: "expense", message: "Aline recorded fuel expense of 85,000 RWF", createdAt: daysFromNow(-2) },
]

export const seedNotifications: AppNotification[] = [
  { id: "n1", level: "warning", title: "Expiring soon", message: "320 cases of Primus expire in 25 days", createdAt: daysFromNow(0), read: false },
  { id: "n2", level: "urgent", title: "Expired product", message: "8 cases of Turbo King expired", createdAt: daysFromNow(0), read: false },
  { id: "n3", level: "urgent", title: "Low stock", message: "Amstel is below the low-stock threshold", createdAt: daysFromNow(0), read: false },
  { id: "n4", level: "info", title: "New stock arrival", message: "100 cases of Skol Lager added to inventory", createdAt: daysFromNow(-1), read: true },
  { id: "n5", level: "warning", title: "Missing empties", message: "Kigali Bar & Lounge has 5 pending empty cases", createdAt: daysFromNow(-1), read: false },
]
