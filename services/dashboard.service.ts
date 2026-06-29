const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalSales: number;
    totalTransactions: number;
    avgOrderValue: number;
    totalEmptyCases: number;
    returnedCases: number;
    pendingReturns: number;
    depositValue: number;
    refundedValue: number;
    totalProducts: number;
    lowStockCount: number;
    expiringCount: number;
    totalCustomers: number;
    activeCustomers: number;
    unreadNotifications: number;
  };
  charts: {
    salesTrend: { date: string; amount: number; count: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
    topCustomers: { name: string; spent: number; transactions: number }[];
  };
  tables: {
    recentTransactions: any[];
    pendingReturns: any[];
    lowStockProducts: any[];
    expiringProducts: any[];
  };
}

export const dashboardService = {
  // Get dashboard data
  async getData(): Promise<DashboardData> {
    const response = await fetch(`${API_BASE}/reports/dashboard`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
  },
};
