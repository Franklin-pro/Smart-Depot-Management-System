// services/users.service.ts
import { api, login as apiLogin, logout as apiLogout, currentUser } from '@/lib/api';
import type { User } from '@/lib/types';

export const usersService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  // Create a new user
  async create(user: Omit<User, 'id' | 'status' | 'createdAt'>): Promise<User> {
    const response = await api.post('/users', user);
    return response.data;
  },

  // Update user
  async update(id: string, user: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, user);
    return response.data;
  },

  // Delete user
  async delete(id: string): Promise<User> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Login - use the api login helper
  async login(email: string, password: string): Promise<any> {
    return await apiLogin(email, password);
  },

  // Signup
  async signup(user: any): Promise<User> {
    const response = await api.post('/auth/signup', user);
    return response.data;
  },

  // Get user profile
  async profileUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    apiLogout();
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    return currentUser();
  }
};