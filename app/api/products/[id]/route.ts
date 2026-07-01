import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/lib/types';

// In-memory storage (use database in production)
let products: Product[] = [];

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = products.find(p => p.id === params.id);
  
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  return NextResponse.json(product);
}

// PATCH /api/products/[id] - Update a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const index = products.findIndex(p => p.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  products[index] = { ...products[index], ...body };
  
  return NextResponse.json(products[index]);
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = products.findIndex(p => p.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  const deleted = products.splice(index, 1)[0];
  
  return NextResponse.json(deleted);
}
