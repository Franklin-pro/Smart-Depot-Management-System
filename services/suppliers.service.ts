// services/suppliers.service.ts
import { api } from '@/lib/api';
import type { Supplier } from '@/lib/types';

export const suppliersService = {
  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    const response = await api.get('/suppliers');
    return response.data;
  },

  // Get a specific supplier
  async getById(id: string): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create a new supplier
  async create(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    const response = await api.post('/suppliers', supplier);
    return response.data;
  },

  // Update a supplier
  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    const response = await api.patch(`/suppliers/${id}`, supplier);
    return response.data;
  },

  // Delete a supplier
  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },

  // Get supplier by name
  async getByName(name: string): Promise<Supplier[]> {
    const response = await api.get(`/suppliers/search?name=${name}`);
    return response.data;
  },
};