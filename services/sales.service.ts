import type { Sale, SaleItem, PaymentMethod } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export type NewSale = {
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  discount: number;
  payment: PaymentMethod;
  amountPaid: number;
  cashier: string;
};

export const salesService = {
  // Get all sales
  async getAll(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE}/sales`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }
    return response.json();
  },

  // Get a specific sale
  async getById(id: string): Promise<Sale> {
    const response = await fetch(`${API_BASE}/sales/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sale');
    }
    return response.json();
  },

  // Create a new sale
  async create(sale: NewSale): Promise<Sale> {
    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sale),
    });
    if (!response.ok) {
      throw new Error('Failed to create sale');
    }
    return response.json();
  },
};
