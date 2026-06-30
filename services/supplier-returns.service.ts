// services/supplier-returns.service.ts
import { api } from '@/lib/api';
import type { SupplierReturn } from '@/lib/types';

export const supplierReturnsService = {
  // Get all supplier returns
  async getAll(): Promise<SupplierReturn[]> {
    const response = await api.get('/supplier-returns');
    return response.data;
  },

  // Get a specific supplier return
  async getById(id: string): Promise<SupplierReturn> {
    const response = await api.get(`/supplier-returns/${id}`);
    return response.data;
  },

  // Create a new supplier return
  async create(returnData: Omit<SupplierReturn, 'id' | 'createdAt'>): Promise<SupplierReturn> {
    const response = await api.post('/supplier-returns', returnData);
    return response.data;
  },

  // Update a supplier return
  async update(id: string, returnData: Partial<SupplierReturn>): Promise<SupplierReturn> {
    const response = await api.patch(`/supplier-returns/${id}`, returnData);
    return response.data;
  },

  // Delete a supplier return
  async delete(id: string): Promise<void> {
    await api.delete(`/supplier-returns/${id}`);
  },

  // Get returns by supplier
  async getBySupplier(supplierId: string): Promise<SupplierReturn[]> {
    const response = await api.get(`/supplier-returns/supplier/${supplierId}`);
    return response.data;
  },
};