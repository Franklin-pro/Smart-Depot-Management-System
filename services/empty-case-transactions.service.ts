import type { EmptyCaseTransaction } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const emptyCaseTransactionsService = {
  // Get all empty case transactions
  async getAll(): Promise<EmptyCaseTransaction[]> {
    const response = await fetch(`${API_BASE}/empty-case-transactions`);
    if (!response.ok) {
      throw new Error('Failed to fetch empty case transactions');
    }
    return response.json();
  },

  // Create a new empty case transaction
  async create(transaction: Omit<EmptyCaseTransaction, 'id' | 'returnedQuantity' | 'pendingQuantity' | 'totalDepositValue' | 'refundedAmount' | 'productName' | 'status' | 'createdAt' | 'updatedAt'>): Promise<EmptyCaseTransaction> {
    const response = await fetch(`${API_BASE}/empty-case-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error('Failed to create empty case transaction');
    }
    return response.json();
  },

  // Process empty case return
  async processReturn(id: string, data: { returnQuantity: number; processedBy: string }): Promise<EmptyCaseTransaction> {
    const response = await fetch(`${API_BASE}/empty-case-transactions/${id}/process-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to process return');
    }
    return response.json();
  },
};
