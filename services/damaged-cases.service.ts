// services/damaged-cases.service.ts
import { api } from '@/lib/api';
import type { DamagedCase } from '@/lib/types';

export const damagedCasesService = {
  // Get all damaged cases
  async getAll(): Promise<DamagedCase[]> {
    const response = await api.get('/damaged-cases');
    return response.data;
  },

  // Get a specific damaged case
  async getById(id: string): Promise<DamagedCase> {
    const response = await api.get(`/damaged-cases/${id}`);
    return response.data;
  },

  // Create a new damaged case
  async create(caseData: Omit<DamagedCase, 'id' | 'createdAt'>): Promise<DamagedCase> {
    const response = await api.post('/damaged-cases', caseData);
    return response.data;
  },

  // Update a damaged case
  async update(id: string, caseData: Partial<DamagedCase>): Promise<DamagedCase> {
    const response = await api.patch(`/damaged-cases/${id}`, caseData);
    return response.data;
  },

  // Delete a damaged case
  async delete(id: string): Promise<void> {
    await api.delete(`/damaged-cases/${id}`);
  },

  // Get damaged cases by product
  async getByProduct(productId: string): Promise<DamagedCase[]> {
    const response = await api.get(`/damaged-cases/product/${productId}`);
    return response.data;
  },
};