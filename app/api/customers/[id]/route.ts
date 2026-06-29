import { NextRequest, NextResponse } from 'next/server';
import { seedCustomers } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';

// In-memory storage (use database in production)
let customers = [...seedCustomers];

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = customers.find(c => c.id === params.id);
  
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
  
  return NextResponse.json(customer);
}

// PATCH /api/customers/[id] - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const index = customers.findIndex(c => c.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
  
  customers[index] = { 
    ...customers[index], 
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(customers[index]);
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = customers.findIndex(c => c.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
  
  const deleted = customers.splice(index, 1)[0];
  
  return NextResponse.json(deleted);
}
