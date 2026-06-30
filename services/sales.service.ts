// services/sales.service.ts
import { api } from '@/lib/api';
import type { Sale } from '@/lib/types';

export interface NewSale {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'credit';
  notes?: string;
}

export const salesService = {
  // Get all sales
  async getAll(): Promise<Sale[]> {
    const response = await api.get('/sales');
    return response.data;
  },

  // Get a specific sale
  async getById(id: string): Promise<Sale> {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Create a new sale
  async create(sale: NewSale): Promise<Sale> {
    const response = await api.post('/sales', sale);
    return response.data;
  },

  // Update a sale
  async update(id: string, sale: Partial<Sale>): Promise<Sale> {
    const response = await api.patch(`/sales/${id}`, sale);
    return response.data;
  },

  // Delete a sale
  async delete(id: string): Promise<void> {
    await api.delete(`/sales/${id}`);
  },

  // Get sales by customer
  async getByCustomer(customerId: string): Promise<Sale[]> {
    const response = await api.get(`/sales/customer/${customerId}`);
    return response.data;
  },

  // Get sales by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const response = await api.get(`/sales/date-range`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get daily sales summary
  async getDailySummary(date: string): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    paymentMethods: Record<string, number>;
  }> {
    const response = await api.get(`/sales/daily-summary/${date}`);
    return response.data;
  },
};