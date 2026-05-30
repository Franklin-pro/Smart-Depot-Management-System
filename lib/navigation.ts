import type { Role } from "./types"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  BarChart3,
  PackageOpen,
  CalendarClock,
  Users,
  Settings,
  PlusCircle,
  Truck,
  History,
  UserCircle,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const items = {
  dashboard: { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  inventory: { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  addStock: { label: "Add Stock", href: "/dashboard/inventory/add", icon: PlusCircle },
  pos: { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  sales: { label: "Sales", href: "/dashboard/sales", icon: Receipt },
  salesReports: { label: "Sales Reports", href: "/dashboard/sales", icon: Receipt },
  salesHistory: { label: "Sales History", href: "/dashboard/sales", icon: History },
  customers: { label: "Customers", href: "/dashboard/customers", icon: UserCircle },
  receipts: { label: "Receipts", href: "/dashboard/receipts", icon: Receipt },
  expenses: { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  reports: { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  emptyCases: { label: "Empty Cases", href: "/dashboard/empty-cases", icon: PackageOpen },
  expiry: { label: "Expiry Tracking", href: "/dashboard/expiry", icon: CalendarClock },
  suppliers: { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  users: { label: "Users", href: "/dashboard/users", icon: Users },
  settings: { label: "Settings", href: "/dashboard/settings", icon: Settings },
} satisfies Record<string, NavItem>

export const navByRole: Record<Role, NavItem[]> = {
  owner: [
    items.dashboard,
    items.inventory,
    items.sales,
    items.expenses,
    items.reports,
    items.emptyCases,
    items.expiry,
    items.users,
    items.settings,
  ],
  manager: [
    items.dashboard,
    items.inventory,
    items.salesReports,
    items.expenses,
    items.expiry,
    items.emptyCases,
  ],
  cashier: [items.pos, items.salesHistory, items.customers, items.receipts],
  storekeeper: [items.inventory, items.addStock, items.emptyCases, items.expiry, items.suppliers],
}

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
  storekeeper: "Storekeeper",
}

export const roleLandingPage: Record<Role, string> = {
  owner: "/dashboard",
  manager: "/dashboard",
  cashier: "/dashboard/pos",
  storekeeper: "/dashboard/inventory",
}
