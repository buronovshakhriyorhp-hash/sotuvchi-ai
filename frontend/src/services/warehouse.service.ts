import api from '../api/axios';

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  isActive: boolean;
}

class WarehouseService {
  async getMany(): Promise<Warehouse[]> {
    const res: any = await api.get('/warehouses');
    return res.data || [];
  }

  async create(data: { name: string; address?: string }): Promise<Warehouse> {
    const res: any = await api.post('/warehouses', data);
    return res.data || res;
  }
}

export const warehouseService = new WarehouseService();
