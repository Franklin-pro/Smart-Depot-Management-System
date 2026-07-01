import { Customer, EmptyCaseTransaction, Expense, Product, Sale } from '@/lib/types';
import { NextResponse } from 'next/server'; 

// In-memory storage (use database in production)
const products: Product[] = [];
const sales: Sale[] = [];
const expenses: Expense[] = [];
const customers: Customer[] = [];
const emptyCaseTransactions: EmptyCaseTransaction[] = [];
const notifications: Notification[] = [];

// GET /api/reports/dashboard - Get dashboard data
export async function GET() {
  const completedSales = sales.filter(s => s.status === 'completed');
  
  // Calculate summary metrics
  const totalRevenue = completedSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const totalSales = completedSales.reduce((sum, s) => sum + (s.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0);
  const totalTransactions = completedSales.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  const totalEmptyCases = emptyCaseTransactions.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
  const returnedCases = emptyCaseTransactions.reduce((sum, t) => sum + (t.returnedQuantity || 0), 0);
  const pendingReturns = totalEmptyCases - returnedCases;
  const depositValue = emptyCaseTransactions.reduce((sum, t) => sum + (t.totalDepositValue || 0), 0);
  const refundedValue = emptyCaseTransactions.reduce((sum, t) => sum + (t.refundedAmount || 0), 0);
  
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.fullCases < (p.lowStockThreshold || 40)).length;
  const expiringCount = products.filter(p => {
    if (!p.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;
  
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.totalTransactions > 0).length;
  
  const unreadNotifications = notifications.filter((n:any) => !n.read).length;
  
  // Sales trend data (last 7 days)
  const salesByDate = new Map<string, { amount: number; count: number }>();
  completedSales.forEach(sale => {
    const date = new Date(sale.createdAt).toLocaleDateString();
    const existing = salesByDate.get(date) || { amount: 0, count: 0 };
    salesByDate.set(date, {
      amount: existing.amount + (sale.total || 0),
      count: existing.count + 1
    });
  });
  
  const salesTrend = Array.from(salesByDate.entries())
    .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);
  
  // Top products
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  completedSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const productName = product?.name || `Product ${item.productId?.slice(-6) || "Unknown"}`;
      const existing = productSales.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity || 0;
        existing.revenue += item.subtotal || 0;
      } else {
        productSales.set(item.productId, {
          name: productName,
          quantity: item.quantity || 0,
          revenue: item.subtotal || 0
        });
      }
    });
  });
  
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  
  // Top customers
  const customerSales = new Map<string, { name: string; spent: number; transactions: number }>();
  completedSales.forEach(sale => {
    const customerId = sale.customerId || "walk-in";
    const existing = customerSales.get(customerId);
    if (existing) {
      existing.spent += sale.total || 0;
      existing.transactions += 1;
    } else {
      customerSales.set(customerId, {
        name: sale.customerName || "Walk-in Customer",
        spent: sale.total || 0,
        transactions: 1
      });
    }
  });
  
  const topCustomers = Array.from(customerSales.values())
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);
  
  // Recent transactions
  const recentTransactions = completedSales
    .slice(0, 10)
    .map(sale => ({
      id: sale.id,
      date: sale.createdAt,
      invoice: sale.invoiceNumber || "N/A",
      customer: sale.customerName || "Walk-in",
      amount: sale.total || 0,
      status: sale.status || "completed"
    }));
  
  // Pending empty case returns
  const pendingReturnsList = emptyCaseTransactions
    .filter(t => (t.pendingQuantity || 0) > 0)
    .slice(0, 10)
    .map(t => ({
      id: t.id,
      customer: t.customerName || "Unknown",
      product: t.productName || "Unknown Product",
      total: t.totalQuantity || 0,
      pending: t.pendingQuantity || 0,
      depositValue: (t.pendingQuantity || 0) * (t.depositAmount || 0),
      status: t.status
    }));
  
  // Low stock products
  const lowStockProducts = products
    .filter(p => p.fullCases < (p.lowStockThreshold || 40))
    .map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.fullCases,
      threshold: p.lowStockThreshold || 40,
      status: p.fullCases === 0 ? "Out of Stock" : "Low Stock"
    }));
  
  // Expiring products
  const expiringProducts = products
    .filter(p => {
      if (!p.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      batch: p.batchNumber || "N/A",
      expiryDate: p.expiryDate,
      stock: p.fullCases || 0
    }));
  
  return NextResponse.json({
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalSales,
      totalTransactions,
      avgOrderValue,
      totalEmptyCases,
      returnedCases,
      pendingReturns,
      depositValue,
      refundedValue,
      totalProducts,
      lowStockCount,
      expiringCount,
      totalCustomers,
      activeCustomers,
      unreadNotifications
    },
    charts: {
      salesTrend,
      topProducts,
      topCustomers
    },
    tables: {
      recentTransactions,
      pendingReturns: pendingReturnsList,
      lowStockProducts,
      expiringProducts
    }
  });
}
