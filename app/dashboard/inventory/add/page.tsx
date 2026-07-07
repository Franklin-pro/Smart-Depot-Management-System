"use client";

import { ProductForm, ProductFormValues } from "@/components/inventory/product-form";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export default function AddStockPage() {
  const { addProduct } = useApp();

  const handleAdd = async (values: ProductFormValues) => {
    try {
      const extendedProduct: any = {
        ...values,
        bottleInfo: {
          damaged: 0,
          missing: 0,
          returned: 0,
        },
        partialCases: [],
        lastStockCheck: new Date(),
      };
      await addProduct(extendedProduct);
      toast.success(`${values.name} added to inventory`);
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ProductForm onSubmit={handleAdd} submitLabel="Add to inventory" />
    </div>
  );
}