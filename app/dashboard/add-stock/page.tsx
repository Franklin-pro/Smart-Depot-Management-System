"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PackagePlus } from "lucide-react"
import { useApp } from "@/lib/store"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProductForm, type ProductFormValues } from "@/components/inventory/product-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddStockPage() {
  const { addProduct } = useApp()
  const router = useRouter()
  const [formKey, setFormKey] = useState(0)

  function handleSubmit(values: ProductFormValues) {
    addProduct(values)
    toast.success(`${values.name} added to inventory`)
    setFormKey((k) => k + 1)
  }

  return (
    <>
      <DashboardHeader title="Add New Stock" description="Record incoming beer stock and supplier details" />
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackagePlus className="size-4 text-primary" />
                Stock Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm key={formKey} onSubmit={handleSubmit} submitLabel="Add to Inventory" />
            </CardContent>
          </Card>
          <Card className="h-fit bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
              <p>Enter the full case count received. Empty cases are tracked separately as customers return them.</p>
              <p>Always set an accurate expiry date so the system can flag products approaching expiry.</p>
              <p>Batch numbers help trace stock back to a specific supplier delivery.</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/inventory")}
                className="mt-1 self-start text-sm font-medium text-primary hover:underline"
              >
                View full inventory
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
