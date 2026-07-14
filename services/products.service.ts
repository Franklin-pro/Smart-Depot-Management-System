// services/products.service.ts
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export const productsService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data;
  },

  // Get a specific product
  async getById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create a new product
 // In services/products.ts
async create(product: any): Promise<Product> {
  // Ensure all fields are included
  const payload = {
    // Required fields
    name: product.name,
    brand: product.brand,
    category: product.category,
    supplier: product.supplier || '',
    fullCases: product.fullCases || 0,
    emptyCases: product.emptyCases || 0,
    purchasePrice: product.purchasePrice || 0,
    sellingPrice: product.sellingPrice || 0,
    batchNumber: product.batchNumber || '',
    manufactureDate: product.manufactureDate || new Date().toISOString(),
    expiryDate: product.expiryDate || new Date().toISOString(),
    lowStockThreshold: product.lowStockThreshold || 40,
    depositAmount: product.depositAmount || 0,
    
    // Extended fields - THE FIELDS THAT WERE MISSING
    bottleInfo: product.bottleInfo || {
      damaged: 0,
      missing: 0,
      returned: 0,
      notes: '',
    },
    partialCases: product.partialCases || [],
    lastStockCheck: product.lastStockCheck || new Date().toISOString(),
    containerType: product.containerType || 'case',
    containerSizeLabel: product.containerSizeLabel || 'Grand',
    bottleType: product.bottleType || 'grand',
    purchasePricePerContainer: product.purchasePricePerContainer || 0,
    sellingPricePerContainer: product.sellingPricePerContainer || 0,
    supplierSent: product.supplierSent || 0,
    receivedCases: product.receivedCases || 0,
    remainingToReceive: product.remainingToReceive || 0,
    supplierDebtValue: product.supplierDebtValue || 0,
    payments: product.payments || [],
    totalPaid: product.totalPaid || 0,
    balanceDue: product.balanceDue || 0,
  }
  
  console.log('Sending to API:', payload) // Debug log
  
  const response = await api.post('/products', payload)
  return response.data
},

  // Update a product
  async update(id: string, product: Partial<Product>): Promise<Product> {
    const response = await api.patch(`/products/${id}`, product);
    return response.data;
  },

  // Delete a product
  async delete(id: string): Promise<Product> {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get products by category
  async getByCategory(category: string): Promise<Product[]> {
    const response = await api.get(`/products/category/${category}`);
    return response.data;
  },

  // Get low stock products
  async getLowStock(threshold: number = 10): Promise<Product[]> {
    const response = await api.get('/products/low-stock', {
      params: { threshold }
    });
    return response.data;
  },

  // Search products
  async search(query: string): Promise<Product[]> {
    const response = await api.get('/products/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Update stock quantity
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const response = await api.patch(`/products/${id}/stock`, {
      quantity,
      operation
    });
    return response.data;
  },

  // Get product by barcode
  async getByBarcode(barcode: string): Promise<Product> {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Bulk update products
  async bulkUpdate(products: Array<{ id: string; data: Partial<Product> }>): Promise<Product[]> {
    const response = await api.patch('/products/bulk', { products });
    return response.data;
  },
};