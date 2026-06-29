import { NextRequest, NextResponse } from 'next/server';
import { seedSales } from '@/lib/mock-data';

// In-memory storage (use database in production)
let sales = [...seedSales];

// GET /api/sales/[id] - Get a specific sale
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sale = sales.find(s => s.id === params.id);
  
  if (!sale) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  }
  
  return NextResponse.json(sale);
}
