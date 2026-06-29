import type { Expense } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const expensesService = {
  // Get all expenses
  async getAll(): Promise<Expense[]> {
    const response = await fetch(`${API_BASE}/expenses`);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    return response.json();
  },

  // Create a new expense
  async create(expense: Omit<Expense, 'id' | 'invoiceNumber'>): Promise<Expense> {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    if (!response.ok) {
      throw new Error('Failed to create expense');
    }
    return response.json();
  },
  async update(id: string, expense: Partial<Expense>): Promise<Expense> {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    return response.json();
  },

  // Delete an expense
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  },
};
