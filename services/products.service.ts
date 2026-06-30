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
  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const response = await api.post('/products', product);
    return response.data;
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