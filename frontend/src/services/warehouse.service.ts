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
}

export const warehouseService = new WarehouseService();
