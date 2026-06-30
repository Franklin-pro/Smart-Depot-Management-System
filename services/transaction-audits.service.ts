// services/transaction-audits.service.ts
import { api } from '@/lib/api';
import type { TransactionAudit } from '@/lib/types';

export const transactionAuditsService = {
  // Get all transaction audits
  async getAll(): Promise<TransactionAudit[]> {
    const response = await api.get('/transaction-audits');
    return response.data;
  },

  // Get a specific transaction audit
  async getById(id: string): Promise<TransactionAudit> {
    const response = await api.get(`/transaction-audits/${id}`);
    return response.data;
  },
  async create (auditData: any): Promise<TransactionAudit> {
    const response = await api.post('/transaction-audits', auditData);
    return response.data;
  },

  // Get audits by user
  async getByUser(userId: string): Promise<TransactionAudit[]> {
    const response = await api.get(`/transaction-audits/user/${userId}`);
    return response.data;
  },

  // Get audits by date range
  async getByDateRange(startDate: string, endDate: string): Promise<TransactionAudit[]> {
    const response = await api.get(`/transaction-audits/date-range`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get audits by transaction type
  async getByType(transactionType: string): Promise<TransactionAudit[]> {
    const response = await api.get(`/transaction-audits/type/${transactionType}`);
    return response.data;
  },
};