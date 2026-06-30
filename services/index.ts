// services/index.ts
export { api } from '@/lib/api';
export { usersService } from './users.service';
export { customersService } from './customers.service';
export { productsService } from './products.service';
export { salesService, type NewSale } from './sales.service';
export { emptyCaseTransactionsService } from './empty-case-transactions.service';
export { notificationsService } from './notifications.service';
export { suppliersService } from './suppliers.service';
export { expensesService } from './expenses.service';
export { activitiesService } from './activities.service';
export { supplierReturnsService } from './supplier-returns.service';
export { damagedCasesService } from './damaged-cases.service';
export { transactionAuditsService } from './transaction-audits.service';
export { dashboardService } from './dashboard.service';