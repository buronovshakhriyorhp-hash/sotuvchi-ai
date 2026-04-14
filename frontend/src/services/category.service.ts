import api from '../api/axios';
import { Category } from '../types';

class CategoryService {
  async getMany(): Promise<Category[]> {
    return (api.get('/categories') as any);
  }

  async create(name: string): Promise<Category> {
    return (api.post('/categories', { name }) as any);
  }
}

export const categoryService = new CategoryService();
