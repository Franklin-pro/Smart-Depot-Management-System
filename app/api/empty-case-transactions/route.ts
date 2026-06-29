import { NextRequest, NextResponse } from 'next/server';
import { seedEmptyCaseTransactions, seedProducts, seedCustomers } from '@/lib/mock-data';
import type { EmptyCaseTransaction } from '@/lib/types';

// In-memory storage (use database in production)
let transactions = [...seedEmptyCaseTransactions];
let products = [...seedProducts];
let customers = [...seedCustomers];

// GET /api/empty-case-transactions - Get all empty case transactions
export async function GET() {
  return NextResponse.json(transactions);
}

// POST /api/empty-case-transactions - Create a new empty case transaction
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, customerId, customerName, transactionType, totalQuantity, depositAmount, createdBy } = body;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  const totalDepositValue = totalQuantity * depositAmount;
  
  const newTransaction: EmptyCaseTransaction = {
    id: `ect${Date.now()}`,
    productId,
    customerId,
    customerName,
    transactionType,
    totalQuantity,
    returnedQuantity: 0,
    pendingQuantity: totalQuantity,
    depositAmount,
    totalDepositValue,
    refundedAmount: 0,
    productName: product.name,
    status: 'pending',
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  transactions.push(newTransaction);
  
  return NextResponse.json(newTransaction, { status: 201 });
}
