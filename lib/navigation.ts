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

// Extend the Role type locally to include admin
type ExtendedRole = Role | "admin"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles?: ExtendedRole[]
}

const items = {
  dashboard: { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "storekeeper"] as ExtendedRole[] },
  inventory: { label: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["owner", "manager", "storekeeper"] as ExtendedRole[] },
  addStock: { label: "Add Stock", href: "/dashboard/inventory/add", icon: PlusCircle, roles: ["owner", "storekeeper"] as ExtendedRole[] },
  pos: { label: "POS", href: "/dashboard/pos", icon: ShoppingCart, roles: ["cashier", "staff", "owner", "manager"] as ExtendedRole[] },
  sales: { label: "Sales", href: "/dashboard/sales", icon: Receipt, roles: ["owner", "manager"] as ExtendedRole[] },
  salesReports: { label: "Sales Reports", href: "/dashboard/sales", icon: Receipt, roles: ["owner", "manager"] as ExtendedRole[] },
  salesHistory: { label: "Sales History", href: "/dashboard/sales", icon: History, roles: ["cashier", "staff", "owner", "manager"] as ExtendedRole[] },
  customers: { label: "Customers", href: "/dashboard/customers", icon: UserCircle, roles: ["cashier", "staff", "owner", "manager"] as ExtendedRole[] },
  receipts: { label: "Receipts", href: "/dashboard/receipts", icon: Receipt, roles: ["cashier", "staff", "owner", "manager"] as ExtendedRole[] },
  expenses: { label: "Expenses", href: "/dashboard/expenses", icon: Wallet, roles: ["owner", "manager"] as ExtendedRole[] },
  reports: { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["owner", "manager"] as ExtendedRole[] },
  emptyCases: { label: "Empty Cases", href: "/dashboard/empty-case", icon: PackageOpen, roles: ["owner", "manager", "storekeeper"] as ExtendedRole[] },
  expiry: { label: "Expiry Tracking", href: "/dashboard/expiry", icon: CalendarClock, roles: ["owner", "manager", "storekeeper"] as ExtendedRole[] },
  suppliers: { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck, roles: ["owner", "storekeeper"] as ExtendedRole[] },
  users: { label: "Users", href: "/dashboard/users", icon: Users, roles: ["owner"] as ExtendedRole[] },
  settings: { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["owner", "manager"] as ExtendedRole[] },
} satisfies Record<string, NavItem>

// Role-based navigation configuration - use ExtendedRole for the record
export const navByRole: Record<ExtendedRole, NavItem[]> = {
  owner: [
    items.dashboard,
    items.inventory,
    items.addStock,
    items.pos,
    items.sales,
    items.expenses,
    items.reports,
    items.emptyCases,
    items.expiry,
    items.suppliers,
    items.customers,
    items.users,
    items.settings,
  ],
  manager: [
    items.dashboard,
    items.inventory,
    items.pos,
    items.salesReports,
    items.expenses,
    items.reports,
    items.emptyCases,
    items.expiry,
    items.customers,
    items.settings,
  ],
  cashier: [
    items.pos,
    items.salesHistory,
    items.customers,
    items.receipts,
    items.emptyCases,
  ],
  staff: [
    items.pos,
    items.salesHistory,
    items.customers,
    items.receipts,
  ],
  storekeeper: [
    items.dashboard,
    items.inventory,
    items.addStock,
    items.emptyCases,
    items.expiry,
    items.suppliers,
  ],
  admin: [
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
}

// Role labels for all roles including extended ones
export const roleLabels: Record<ExtendedRole, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
  staff: "Staff",
  storekeeper: "Storekeeper",
  admin: "Administrator",
}

// Landing pages for each role
export const roleLandingPage: Record<ExtendedRole, string> = {
  owner: "/dashboard",
  manager: "/dashboard",
  cashier: "/dashboard/pos",
  staff: "/dashboard/pos",
  storekeeper: "/dashboard/inventory",
  admin: "/dashboard",
}

// Helper function to get navigation items for a specific role
export function getNavItemsForRole(role: ExtendedRole | string): NavItem[] {
  // If the role exists in navByRole, return those items
  if (role in navByRole) {
    return navByRole[role as ExtendedRole]
  }
  
  // Fallback: return items that don't have role restrictions or include the role
  return Object.values(items).filter(item => 
    !item.roles || item.roles.includes(role as ExtendedRole)
  )
}

// Helper function to check if a user has access to a specific nav item
export function hasAccessToNavItem(role: ExtendedRole | string, itemHref: string): boolean {
  const item = Object.values(items).find(i => i.href === itemHref)
  if (!item) return false
  if (!item.roles) return true
  return item.roles.includes(role as ExtendedRole)
}

// Get the dashboard route for a role
export function getDashboardRoute(role: ExtendedRole): string {
  return roleLandingPage[role] || "/dashboard"
}