import api from '../api/axios';
import { Product } from '../types';

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface ProductParams {
  search?: string;
  category?: number;
  limit?: number;
  offset?: number;
}

class ProductService {
  async getMany(params?: ProductParams): Promise<ProductListResponse> {
    const res = await api.get<ProductListResponse | Product[]>('/products', { params });
    if (Array.isArray(res)) {
      return { products: res, total: res.length };
    }
    return res;
  }

  async getOne(id: number | string): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  }

  async create(data: Partial<Product> | FormData): Promise<Product> {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post<Product>('/products', data, config);
  }

  async update(id: number | string, data: Partial<Product> | FormData): Promise<Product> {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put<Product>(`/products/${id}`, data, config);
  }

  async delete(id: number | string): Promise<void> {
    return api.delete<void>(`/products/${id}`);
  }
}

export const productService = new ProductService();
