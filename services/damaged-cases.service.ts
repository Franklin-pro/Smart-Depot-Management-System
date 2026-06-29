import type { DamagedCase } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const damagedCasesService = {
  // Get all damaged cases
  async getAll(): Promise<DamagedCase[]> {
    const response = await fetch(`${API_BASE}/damaged-cases`);
    if (!response.ok) {
      throw new Error('Failed to fetch damaged cases');
    }
    return response.json();
  },

  // Create a new damaged case report
  async create(damagedCase: Omit<DamagedCase, 'id'>): Promise<DamagedCase> {
    const response = await fetch(`${API_BASE}/damaged-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(damagedCase),
    });
    if (!response.ok) {
      throw new Error('Failed to create damaged case report');
    }
    return response.json();
  },
};
