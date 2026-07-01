import { NextRequest, NextResponse } from 'next/server';
import type { Supplier } from '@/lib/types';

// In-memory storage (use database in production)
let suppliers: Supplier[] = [];

// GET /api/suppliers - Get all suppliers
export async function GET() {
  return NextResponse.json(suppliers);
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newSupplier: Supplier = {
    id: `s${Date.now()}`,
    ...body,
    productsSupplied: 0,
    createdAt: new Date().toISOString(),
  };
  
  suppliers.push(newSupplier);
  
  return NextResponse.json(newSupplier, { status: 201 });
}
