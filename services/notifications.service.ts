// services/notifications.service.ts
import { api } from '@/lib/api';
import type { AppNotification } from '@/lib/types';

export const notificationsService = {
  // Get all notifications
  async getAll(): Promise<AppNotification[]> {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get unread notifications
  async getUnread(): Promise<AppNotification[]> {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  // Get notification by ID
  async getById(id: string): Promise<AppNotification> {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  // Generate a new notification
  async generate(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification> {
    const response = await api.post('/notifications/generate', notification);
    return response.data;
  },

  // Mark notifications as read
  async markRead(notificationIds?: string[]): Promise<{ success: boolean; updated: number }> {
    const response = await api.post('/notifications/mark-read', { notificationIds });
    return response.data;
  },

  // Mark a single notification as read
  async markAsRead(id: string): Promise<AppNotification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean; updated: number }> {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete a notification
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  // Delete all read notifications
  async deleteAllRead(): Promise<{ success: boolean; deleted: number }> {
    const response = await api.delete('/notifications/read');
    return response.data;
  },

  // Get notification count
  async getCount(): Promise<{ total: number; unread: number }> {
    const response = await api.get('/notifications/count');
    return response.data;
  },

  // Get notifications by type
  async getByType(type: string): Promise<AppNotification[]> {
    const response = await api.get(`/notifications/type/${type}`);
    return response.data;
  },

  // Get notifications by priority
  async getByPriority(priority: 'low' | 'medium' | 'high'): Promise<AppNotification[]> {
    const response = await api.get(`/notifications/priority/${priority}`);
    return response.data;
  },

  // Get recent notifications (limit)
  async getRecent(limit: number = 10): Promise<AppNotification[]> {
    const response = await api.get('/notifications/recent', {
      params: { limit }
    });
    return response.data;
  },

  // Get notifications by date range
  async getByDateRange(startDate: string, endDate: string): Promise<AppNotification[]> {
    const response = await api.get('/notifications/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Subscribe to notifications (WebSocket or SSE - if implemented)
  async subscribe(): Promise<EventSource> {
    const token = localStorage.getItem('accessToken');
    const eventSource = new EventSource(`${api.defaults.baseURL}/notifications/subscribe?token=${token}`);
    return eventSource;
  },

  // Dismiss a notification (archive)
  async dismiss(id: string): Promise<AppNotification> {
    const response = await api.patch(`/notifications/${id}/dismiss`);
    return response.data;
  },
};