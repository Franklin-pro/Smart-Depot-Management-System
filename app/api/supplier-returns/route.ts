import { NextRequest, NextResponse } from 'next/server';
import type { SupplierReturn } from '@/lib/types';

// In-memory storage (use database in production)
let supplierReturns: SupplierReturn[] = [];

// GET /api/supplier-returns - Get all supplier returns
export async function GET() {
  return NextResponse.json(supplierReturns);
}

// POST /api/supplier-returns - Create a new supplier return
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newSupplierReturn: SupplierReturn = {
    id: `sr${Date.now()}`,
    receiptNumber: `SUP-${Date.now()}`,
    ...body,
    returnedDate: body.returnedDate || new Date().toISOString(),
  };
  
  supplierReturns.push(newSupplierReturn);
  
  return NextResponse.json(newSupplierReturn, { status: 201 });
}
