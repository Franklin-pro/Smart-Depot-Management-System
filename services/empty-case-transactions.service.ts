// services/empty-case-transactions.service.ts
import { api } from '@/lib/api';
import type { EmptyCaseTransaction } from '@/lib/types';

export const emptyCaseTransactionsService = {
  // Get all transactions
  async getAll(): Promise<EmptyCaseTransaction[]> {
    const response = await api.get('/empty-case-transactions');
    return response.data;
  },

  // Get a specific transaction
  async getById(id: string): Promise<EmptyCaseTransaction> {
    const response = await api.get(`/empty-case-transactions/${id}`);
    return response.data;
  },

  // Create a new transaction
  async create(transaction: Omit<EmptyCaseTransaction, 'id' | 'createdAt'>): Promise<EmptyCaseTransaction> {
    const response = await api.post('/empty-case-transactions', transaction);
    return response.data;
  },

  // Update a transaction
  async update(id: string, transaction: Partial<EmptyCaseTransaction>): Promise<EmptyCaseTransaction> {
    const response = await api.patch(`/empty-case-transactions/${id}`, transaction);
    return response.data;
  },

  async processReturn (id: string, returnData: { returnQuantity: number,processedBy: string }): Promise<EmptyCaseTransaction> {
    const response = await api.post(`/empty-case-transactions/${id}/process-return`, returnData);
    return response.data;
  },

  // Delete a transaction
  async delete(id: string): Promise<void> {
    await api.delete(`/empty-case-transactions/${id}`);
  },

  // Get transactions by customer
  async getByCustomer(customerId: string): Promise<EmptyCaseTransaction[]> {
    const response = await api.get(`/empty-case-transactions/customer/${customerId}`);
    return response.data;
  },

  // Get pending empty cases
  async getPending(): Promise<EmptyCaseTransaction[]> {
    const response = await api.get('/empty-case-transactions/pending');
    return response.data;
  },
};