// services/expenses.service.ts
import { api } from '@/lib/api';
import type { Expense } from '@/lib/types';

export const expensesService = {
  // Get all expenses
  async getAll(): Promise<Expense[]> {
    const response = await api.get('/expenses');
    return response.data;
  },

  // Get a specific expense
  async getById(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create a new expense
  async create(expense: Omit<Expense, 'id' | 'invoiceNumber'>): Promise<Expense> {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  // Update an expense
  async update(id: string, expense: Partial<Expense>): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}`, expense);
    return response.data;
  },

  // Delete an expense
  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  // Get expenses by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const response = await api.get('/expenses/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get expenses by category
  async getByCategory(category: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/category/${category}`);
    return response.data;
  },

  // Get expenses by payment method
  async getByPaymentMethod(method: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/payment-method/${method}`);
    return response.data;
  },

  // Get expense summary by category
  async getSummaryByCategory(startDate?: string, endDate?: string): Promise<Array<{
    category: string;
    total: number;
    count: number;
    percentage: number;
  }>> {
    const response = await api.get('/expenses/summary/category', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get total expenses for a period
  async getTotal(startDate?: string, endDate?: string): Promise<{
    total: number;
    count: number;
    average: number;
  }> {
    const response = await api.get('/expenses/total', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get monthly expense breakdown
  async getMonthlyBreakdown(year: number): Promise<Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }>> {
    const response = await api.get('/expenses/monthly-breakdown', {
      params: { year }
    });
    return response.data;
  },

  // Generate expense report
  async generateReport(startDate: string, endDate: string): Promise<Blob> {
    const response = await api.get('/expenses/report', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  },
};