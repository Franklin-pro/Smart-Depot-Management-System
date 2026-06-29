import { NextRequest, NextResponse } from 'next/server';
import { seedExpenses } from '@/lib/mock-data';
import type { Expense } from '@/lib/types';

// In-memory storage (use database in production)
let expenses = [...seedExpenses];

// GET /api/expenses - Get all expenses
export async function GET() {
  return NextResponse.json(expenses);
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newExpense: Expense = {
    id: `e${Date.now()}`,
    invoiceNumber: `EXP-${Date.now()}`,
    ...body,
    date: body.date || new Date().toISOString(),
  };
  
  expenses.push(newExpense);
  
  return NextResponse.json(newExpense, { status: 201 });
}
