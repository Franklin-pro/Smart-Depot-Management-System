import { NextRequest, NextResponse } from 'next/server';
import { seedProducts } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

// In-memory storage (use database in production)
let products = [...seedProducts];

// GET /api/products - Get all products
export async function GET() {
  return NextResponse.json(products);
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newProduct: Product = {
    id: `p${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
  };
  
  products.push(newProduct);
  
  return NextResponse.json(newProduct, { status: 201 });
}
