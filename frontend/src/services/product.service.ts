import api from '../api/axios';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category?: { id: number; name: string };
  sellPrice: number;
  wholesalePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  image?: string;
  stocks?: Array<{
    warehouseId: number;
    quantity: number;
    warehouse: { id: number; name: string };
  }>;
}

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
  async getMany(params?: ProductParams): Promise<ProductListResponse | Product[]> {
    return (api.get('/products', { params }) as any);
  }

  async getOne(id: number | string): Promise<Product> {
    return (api.get(`/products/${id}`) as any);
  }

  async create(data: Partial<Product>): Promise<Product> {
    return (api.post('/products', data) as any);
  }

  async update(id: number | string, data: Partial<Product>): Promise<Product> {
    return (api.put(`/products/${id}`, data) as any);
  }

  async delete(id: number | string): Promise<void> {
    return (api.delete(`/products/${id}`) as any);
  }
}

export const productService = new ProductService();
