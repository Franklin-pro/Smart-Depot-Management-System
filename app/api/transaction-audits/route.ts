import { NextRequest, NextResponse } from 'next/server';

import type { TransactionAudit } from '@/lib/types';

// In-memory storage (use database in production)
let transactionAudits: TransactionAudit[] = [];

// GET /api/transaction-audits - Get all transaction audits
export async function GET() {
  return NextResponse.json(transactionAudits);
}

// POST /api/transaction-audits - Create a new transaction audit
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newAudit: TransactionAudit = {
    id: `ta${Date.now()}`,
    ...body,
    performedAt: body.performedAt || new Date().toISOString(),
  };
  
  transactionAudits.push(newAudit);
  
  return NextResponse.json(newAudit, { status: 201 });
}
