import type { ReactNode } from "react"
import { BrandLogo } from "@/components/brand-logo"
import { TrendingUp, PackageOpen, ShieldCheck, CalendarClock } from "lucide-react"

const highlights = [
  { icon: TrendingUp, title: "Real-time analytics", desc: "Live stock, sales and profit insights" },
  { icon: PackageOpen, title: "Empty case tracking", desc: "Never lose track of returnable cases" },
  { icon: CalendarClock, title: "Expiry monitoring", desc: "Automatic alerts before beers expire" },
  { icon: ShieldCheck, title: "Role-based access", desc: "Owner, manager, cashier & storekeeper" },
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand / marketing panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:w-[46%]">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-primary/10 blur-3xl" />
        <BrandLogo textClassName="text-sidebar-foreground" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
              The modern way to run your beer depot.
            </h1>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-sidebar-foreground/70">
              Manage inventory, sales, empty cases, expiry and finances in one professional platform built for
              beverage distributors.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4">
            {highlights.map((h) => (
              <li key={h.title} className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
                <h.icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-medium">{h.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/60">{h.desc}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/50">
          &copy; {new Date().getFullYear()} BeerDepot Management System
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
