import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import type { EmptyCaseTransaction, TransactionType } from "@/lib/types"

// Export all form components
export function EmptyCaseTransactionForm({ 
  products, 
  customers, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  products: any[], 
  customers: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [transactionType, setTransactionType] = useState<TransactionType>("sale")
  const [expectedReturnDate, setExpectedReturnDate] = useState("")
  const [notes, setNotes] = useState("")

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Transaction Type</Label>
          <Select value={transactionType} onValueChange={(v: TransactionType) => setTransactionType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="customer_return">Customer Return</SelectItem>
              <SelectItem value="supplier_return">Supplier Return</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - Deposit: {formatCurrency(product.depositAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {transactionType === "sale" && (
        <div className="space-y-2">
          <Label>Customer</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Expected Return Date</Label>
          <Input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>
      </div>

      {selectedProductData && (
        <div className="p-3 bg-muted rounded-lg dark:bg-muted/50">
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Deposit per case:</span> {formatCurrency(selectedProductData.depositAmount)}</div>
            <div><span className="font-medium">Total deposit value:</span> {formatCurrency(quantity * selectedProductData.depositAmount)}</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          productId: selectedProduct,
          customerId: selectedCustomer,
          customerName: selectedCustomerData?.name,
          transactionType,
          totalQuantity: quantity,
          depositAmount: selectedProductData?.depositAmount || 0,
          totalDepositValue: quantity * (selectedProductData?.depositAmount || 0),
          expectedReturnDate: expectedReturnDate || undefined,
          notes,
          createdBy: currentUser?.name || "System",
        })}>
          Create Transaction
        </Button>
      </div>
    </div>
  )
}

export function SupplierReturnForm({ 
  suppliers, 
  products, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  suppliers: any[], 
  products: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [notes, setNotes] = useState("")

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier)
  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Receipt Number</Label>
          <Input
            placeholder="SUP-2024-XXX"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          supplierId: selectedSupplier,
          supplierName: selectedSupplierData?.name,
          productId: selectedProduct,
          productName: selectedProductData?.name,
          quantity,
          receiptNumber: receiptNumber || `SUP-${Date.now()}`,
          returnedDate: new Date().toISOString(),
          receivedBy: currentUser?.name || "System",
          notes,
        })}>
          Record Return
        </Button>
      </div>
    </div>
  )
}

export function DamagedCaseForm({ 
  products, 
  currentUser,
  onSubmit, 
  onCancel,
}: { 
  products: any[],
  currentUser: any,
  onSubmit: (data: any) => void, 
  onCancel: () => void,
}) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [damageCost, setDamageCost] = useState(0)
  const [notes, setNotes] = useState("")

  const selectedProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Damage Cost</Label>
          <Input
            type="number"
            min="0"
            value={damageCost}
            onChange={(e) => setDamageCost(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Broken during handling">Broken during handling</SelectItem>
            <SelectItem value="Water damage">Water damage</SelectItem>
            <SelectItem value="Transport damage">Transport damage</SelectItem>
            <SelectItem value="Storage damage">Storage damage</SelectItem>
            <SelectItem value="Customer damage">Customer damage</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({
          productId: selectedProduct,
          productName: selectedProductData?.name,
          quantity,
          reason,
          damageCost,
          reportedDate: new Date().toISOString(),
          reportedBy: currentUser?.name || "System",
          notes,
        })}>
          Report Damage
        </Button>
      </div>
    </div>
  )
}

export function ProcessReturnForm({ 
  transaction, 
  onSubmit, 
  onCancel,
}: { 
  transaction: EmptyCaseTransaction, 
  onSubmit: (quantity: number) => void, 
  onCancel: () => void,
}) {
  const [returnQuantity, setReturnQuantity] = useState(transaction.pendingQuantity)

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg dark:bg-muted/50 space-y-2 text-sm">
        <div><span className="font-medium">Total cases:</span> {transaction.totalQuantity}</div>
        <div><span className="font-medium">Already returned:</span> {transaction.returnedQuantity}</div>
        <div><span className="font-medium">Pending:</span> {transaction.pendingQuantity}</div>
        <div><span className="font-medium">Deposit per case:</span> {formatCurrency(transaction.depositAmount)}</div>
        <div><span className="font-medium">Refund amount:</span> {formatCurrency(returnQuantity * transaction.depositAmount)}</div>
      </div>

      <div className="space-y-2">
        <Label>Return Quantity</Label>
        <Input
          type="number"
          min="1"
          max={transaction.pendingQuantity}
          value={returnQuantity}
          onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(returnQuantity)}>
          Process Return
        </Button>
      </div>
    </div>
  )
}