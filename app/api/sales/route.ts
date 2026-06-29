import { NextRequest, NextResponse } from 'next/server';
import { seedSales, seedProducts, seedCustomers } from '@/lib/mock-data';
import type { Sale, SaleItem, Product, Customer } from '@/lib/types';

// In-memory storage (use database in production)
let sales = [...seedSales];
let products = [...seedProducts];
let customers = [...seedCustomers];

// GET /api/sales - Get all sales
export async function GET() {
  return NextResponse.json(sales);
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, customerName, items, discount, payment, amountPaid, cashier } = body;
  
  // Calculate totals
  let subtotal = 0;
  let expectedEmpties = 0;
  
  const saleItems: SaleItem[] = items.map((item: any) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    
    const itemTotal = product.sellingPrice * item.quantity;
    subtotal += itemTotal;
    expectedEmpties += item.quantity;
    
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      subtotal: itemTotal,
    };
  });
  
  const total = subtotal - (discount || 0);
  const change = amountPaid - total;
  
  // Generate receipt number
  const receiptNo = `RCP-${String(sales.length + 1001)}`;
  const invoiceNumber = `INV-${Date.now()}`;
  
  const newSale: Sale = {
    id: `sale${Date.now()}`,
    receiptNo,
    customerId,
    customerName,
    items: saleItems,
    subtotal,
    discount: discount || 0,
    total,
    payment,
    amountPaid,
    change,
    cashier,
    paymentMethod: payment,
    expectedEmpties,
    returnedEmpties: 0,
    invoiceNumber,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  
  // Update product inventory
  items.forEach((item: any) => {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1) {
      products[productIndex].fullCases -= item.quantity;
      products[productIndex].emptyCases += item.quantity;
    }
  });
  
  // Update customer stats if customerId provided
  if (customerId) {
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex !== -1) {
      const customer = customers[customerIndex];
      const totalDepositValue = expectedEmpties * 3000; // Assuming 3000 as default deposit
      
      customers[customerIndex] = {
        ...customer,
        totalSpent: customer.totalSpent + total,
        totalTransactions: customer.totalTransactions + 1,
        pendingEmpties: customer.pendingEmpties + expectedEmpties,
        totalPurchases: customer.totalPurchases + expectedEmpties,
        refundableDeposits: customer.refundableDeposits + totalDepositValue,
        updatedAt: new Date().toISOString(),
      };
    }
  }
  
  sales.push(newSale);
  
  return NextResponse.json(newSale, { status: 201 });
}
