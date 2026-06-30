// services/activities.service.ts
import { api } from '@/lib/api';
import type { Activity } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const activitiesService = {
  // Get all activities
  async getAll(): Promise<Activity[]> {
    const response = await api.get('/activities');
    return response.data;
  },

  // Get activity by ID
  async getById(id: string): Promise<Activity> {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  // Create a new activity
  async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const response = await api.post('/activities', activity);
    return response.data;
  },

  // Update an activity
  async update(id: string, activity: Partial<Activity>): Promise<Activity> {
    const response = await api.patch(`/activities/${id}`, activity);
    return response.data;
  },

  // Delete an activity
  async delete(id: string): Promise<void> {
    await api.delete(`/activities/${id}`);
  },

  // Get activities by user
  async getByUser(userId: string): Promise<Activity[]> {
    const response = await api.get(`/activities/user/${userId}`);
    return response.data;
  },

  // Get recent activities (limit)
  async getRecent(limit: number = 10): Promise<Activity[]> {
    const response = await api.get(`/activities/recent?limit=${limit}`);
    return response.data;
  },
};