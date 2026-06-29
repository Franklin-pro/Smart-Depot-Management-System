import type { AppNotification } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const notificationsService = {
  // Get all notifications
  async getAll(): Promise<AppNotification[]> {
    const response = await fetch(`${API_BASE}/notifications`);
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  // Generate a new notification
  async generate(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification> {
    const response = await fetch(`${API_BASE}/notifications/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      throw new Error('Failed to generate notification');
    }
    return response.json();
  },

  // Mark notifications as read
  async markRead(notificationIds?: string[]): Promise<{ success: boolean; updated: number }> {
    const response = await fetch(`${API_BASE}/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationIds }),
    });
    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }
    return response.json();
  },
};
