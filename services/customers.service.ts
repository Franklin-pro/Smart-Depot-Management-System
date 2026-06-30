// services/customers.service.ts
import { api } from '@/lib/api';
import type { Customer } from '@/lib/types';

export const customersService = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    const response = await api.get('/customers');
    return response.data;
  },

  // Get a specific customer
  async getById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create a new customer
  async create(customer: Omit<Customer, 'id' | 'totalSpent' | 'totalTransactions' | 'pendingEmpties' | 'totalPurchases' | 'refundableDeposits' | 'unpaidBalance' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await api.post('/customers', customer);
    return response.data;
  },

  // Update a customer
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, customer);
    return response.data;
  },

  // Delete a customer
  async delete(id: string): Promise<Customer> {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Get customer by phone number (optional helper)
  async getByPhone(phone: string): Promise<Customer> {
    const response = await api.get(`/customers/phone/${phone}`);
    return response.data;
  },

  // Get customer statistics (optional)
  async getStats(id: string): Promise<{
    totalSpent: number;
    totalTransactions: number;
    pendingEmpties: number;
    unpaidBalance: number;
  }> {
    const response = await api.get(`/customers/${id}/stats`);
    return response.data;
  },
};