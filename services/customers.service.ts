import type { Customer } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const customersService = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE}/customers`);
    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }
    return response.json();
  },

  // Get a specific customer
  async getById(id: string): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch customer');
    }
    return response.json();
  },

  // Create a new customer
  async create(customer: Omit<Customer, 'id' | 'totalSpent' | 'totalTransactions' | 'pendingEmpties' | 'totalPurchases' | 'refundableDeposits' | 'unpaidBalance' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    if (!response.ok) {
      throw new Error('Failed to create customer');
    }
    return response.json();
  },

  // Update a customer
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    if (!response.ok) {
      throw new Error('Failed to update customer');
    }
    return response.json();
  },

  // Delete a customer
  async delete(id: string): Promise<Customer> {
    const response = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete customer');
    }
    return response.json();
  },
};
