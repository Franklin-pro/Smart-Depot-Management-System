// services/dashboard.service.ts
import { api } from '@/lib/api';

export interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalExpenses: number;
  recentSales: Array<{
    id: string;
    customerName: string;
    total: number;
    date: string;
  }>;
  salesByDay: Array<{
    date: string;
    total: number;
    count: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  pendingEmpties: number;
  lowStockProducts: number;
}

export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    const response = await api.get(`/reports/dashboard`);
    return response.data;
  },

  // Get recent activity
  // async getRecentActivity(limit: number = 10): Promise<Array<{
  //   id: string;
  //   type: string;
  //   description: string;
  //   user: string;
  //   timestamp: string;
  // }>> {
  //   const response = await api.get('/dashboard/recent-activity', {
  //     params: { limit }
  //   });
  //   return response.data;
  // },
};