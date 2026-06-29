import { NextRequest, NextResponse } from 'next/server';
import { seedEmptyCaseTransactions, seedCustomers, seedProducts } from '@/lib/mock-data';
import type { EmptyCaseTransaction, TransactionAudit } from '@/lib/types';

// In-memory storage (use database in production)
let transactions = [...seedEmptyCaseTransactions];
let customers = [...seedCustomers];
let products = [...seedProducts];
let audits: TransactionAudit[] = [];

// POST /api/empty-case-transactions/[id]/process-return - Process empty case return
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { returnQuantity, processedBy } = body;
  
  const transactionIndex = transactions.findIndex(t => t.id === params.id);
  
  if (transactionIndex === -1) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }
  
  const transaction = transactions[transactionIndex];
  
  if (returnQuantity > transaction.pendingQuantity) {
    return NextResponse.json({ error: 'Return quantity exceeds pending quantity' }, { status: 400 });
  }
  
  const previousState = { ...transaction };
  
  // Update transaction
  const updatedTransaction: EmptyCaseTransaction = {
    ...transaction,
    returnedQuantity: transaction.returnedQuantity + returnQuantity,
    pendingQuantity: transaction.pendingQuantity - returnQuantity,
    refundedAmount: transaction.refundedAmount + (returnQuantity * transaction.depositAmount),
    actualReturnDate: new Date().toISOString(),
    status: transaction.pendingQuantity - returnQuantity === 0 ? 'completed' : 'partial',
    updatedAt: new Date().toISOString(),
  };
  
  transactions[transactionIndex] = updatedTransaction;
  
  // Update customer deposits
  if (transaction.customerId) {
    const customerIndex = customers.findIndex(c => c.id === transaction.customerId);
    if (customerIndex !== -1) {
      const customer = customers[customerIndex];
      customers[customerIndex] = {
        ...customer,
        pendingEmpties: customer.pendingEmpties - returnQuantity,
        refundableDeposits: customer.refundableDeposits - (returnQuantity * transaction.depositAmount),
        updatedAt: new Date().toISOString(),
      };
    }
  }
  
  // Update product empty cases
  const productIndex = products.findIndex(p => p.id === transaction.productId);
  if (productIndex !== -1) {
    products[productIndex].emptyCases -= returnQuantity;
  }
  
  // Create audit log
  const audit: TransactionAudit = {
    id: `ta${Date.now()}`,
    transactionId: transaction.id,
    transactionType: 'empty_case',
    action: 'processed',
    previousState,
    newState: updatedTransaction,
    performedBy: processedBy,
    performedAt: new Date().toISOString(),
    notes: `Processed return of ${returnQuantity} empty cases`,
  };
  
  audits.push(audit);
  
  return NextResponse.json(updatedTransaction);
}
