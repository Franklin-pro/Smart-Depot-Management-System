import type { Supplier } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const suppliersService = {
  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    const response = await fetch(`${API_BASE}/suppliers`);
    if (!response.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    return response.json();
  },

  // Create a new supplier
  async create(supplier: Omit<Supplier, 'id' | 'productsSupplied' | 'createdAt'>): Promise<Supplier> {
    const response = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supplier),
    });
    if (!response.ok) {
      throw new Error('Failed to create supplier');
    }
    return response.json();
  },
};
