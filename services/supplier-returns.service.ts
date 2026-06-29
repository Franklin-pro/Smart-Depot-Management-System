import type { SupplierReturn } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const supplierReturnsService = {
  // Get all supplier returns
  async getAll(): Promise<SupplierReturn[]> {
    const response = await fetch(`${API_BASE}/supplier-returns`);
    if (!response.ok) {
      throw new Error('Failed to fetch supplier returns');
    }
    return response.json();
  },

  // Create a new supplier return
  async create(supplierReturn: Omit<SupplierReturn, 'id' | 'receiptNumber'>): Promise<SupplierReturn> {
    const response = await fetch(`${API_BASE}/supplier-returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supplierReturn),
    });
    if (!response.ok) {
      throw new Error('Failed to create supplier return');
    }
    return response.json();
  },
};
