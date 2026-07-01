import { NextRequest, NextResponse } from 'next/server';

import type { DamagedCase } from '@/lib/types';

// In-memory storage (use database in production)
let damagedCases: DamagedCase[] = [];

// GET /api/damaged-cases - Get all damaged cases
export async function GET() {
  return NextResponse.json(damagedCases);
}

// POST /api/damaged-cases - Create a new damaged case report
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newDamagedCase: DamagedCase = {
    id: `dc${Date.now()}`,
    ...body,
    reportedDate: body.reportedDate || new Date().toISOString(),
  };
  
  damagedCases.push(newDamagedCase);
  
  return NextResponse.json(newDamagedCase, { status: 201 });
}
