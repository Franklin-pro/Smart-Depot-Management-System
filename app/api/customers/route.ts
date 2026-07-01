import { NextRequest, NextResponse } from 'next/server';
import type { Customer } from '@/lib/types';

// In-memory storage (use database in production)
let customers: Customer[] = [];

// GET /api/customers - Get all customers
export async function GET() {
  return NextResponse.json(customers);
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newCustomer: Customer = {
    id: `c${Date.now()}`,
    ...body,
    totalSpent: 0,
    totalTransactions: 0,
    pendingEmpties: 0,
    totalPurchases: 0,
    refundableDeposits: 0,
    unpaidBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  customers.push(newCustomer);
  
  return NextResponse.json(newCustomer, { status: 201 });
}
