import type { TransactionAudit } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const transactionAuditsService = {
  // Get all transaction audits
  async getAll(): Promise<TransactionAudit[]> {
    const response = await fetch(`${API_BASE}/transaction-audits`);
    if (!response.ok) {
      throw new Error('Failed to fetch transaction audits');
    }
    return response.json();
  },

  // Create a new transaction audit
  async create(audit: Omit<TransactionAudit, 'id' | 'performedAt'>): Promise<TransactionAudit> {
    const response = await fetch(`${API_BASE}/transaction-audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...audit,
        performedAt: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create transaction audit');
    }
    return response.json();
  },
};
