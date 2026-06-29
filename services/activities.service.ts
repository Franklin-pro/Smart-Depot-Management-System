import type { Activity } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const activitiesService = {
  // Get all activities
  async getAll(): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/activities`);
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    return response.json();
  },

  // Create a new activity
  async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    if (!response.ok) {
      throw new Error('Failed to create activity');
    }
    return response.json();
  },
};
