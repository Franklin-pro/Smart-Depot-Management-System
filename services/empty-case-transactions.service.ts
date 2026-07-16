// services/empty-case-transactions.service.ts
import { api } from '@/lib/api';
import type { EmptyCaseTransaction, DamagedCase, SupplierReturn } from '@/lib/types';

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

  // Process a return
  async processReturn(id: string, returnData: { returnQuantity: number, processedBy: string }): Promise<EmptyCaseTransaction> {
    const response = await api.post(`/empty-case-transactions/${id}/process-return`, returnData);
    return response.data;
  },

  async updateSupplierReturn (id: string, returnData: Partial<SupplierReturn>): Promise<void> {
    await api.patch(`/supplier-returns/${id}`, returnData);
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

  // ============================================
  // DAMAGED CASES CRUD OPERATIONS
  // ============================================

  // Get all damaged cases
  async getDamagedCases(): Promise<DamagedCase[]> {
    const response = await api.get('/damaged-cases');
    return response.data;
  },

  // Get a specific damaged case by ID
  async getDamagedCaseDetails(id: string): Promise<DamagedCase> {
    const response = await api.get(`/damaged-cases/${id}`);
    return response.data;
  },

  // Create a new damaged case
  async createDamagedCase(data: Omit<DamagedCase, 'id' | 'createdAt'>): Promise<DamagedCase> {
    const response = await api.post('/damaged-cases', data);
    return response.data;
  },

  // Update a damaged case
  async updateDamagedCase(id: string, data: Partial<DamagedCase>): Promise<DamagedCase> {
    const response = await api.patch(`/damaged-cases/${id}`, data);
    return response.data;
  },

  // Delete a damaged case
  async deleteDamagedCase(id: string): Promise<void> {
    await api.delete(`/damaged-cases/${id}`);
  },

  // ============================================
  // SUPPLIER RETURNS CRUD OPERATIONS
  // ============================================

  // Get all supplier returns
  async getSupplierReturns(): Promise<SupplierReturn[]> {
    const response = await api.get('/supplier-returns');
    return response.data;
  },

  // Create a supplier return
  async createSupplierReturn(data: Omit<SupplierReturn, 'id' | 'createdAt'>): Promise<SupplierReturn> {
    const response = await api.post('/supplier-returns', data);
    return response.data;
  },

  // Delete a supplier return
  async deleteSupplierReturn(id: string): Promise<void> {
    await api.delete(`/supplier-returns/${id}`);
  },
};