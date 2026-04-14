import Dexie, { Table } from 'dexie';

export interface OfflineSale {
  id?: number;
  data: any;
  createdAt: number;
}

export interface CachedProduct {
  id: number;
  sku: string;
  name: string;
  sellPrice: number;
  stock: number;
  categoryId: number;
  categoryName?: string;
  image?: string;
}

export interface CachedCustomer {
  id: number;
  name: string;
  phone: string;
}

export class NexusDB extends Dexie {
  products!: Table<CachedProduct>;
  customers!: Table<CachedCustomer>;
  salesQueue!: Table<OfflineSale>;

  constructor() {
    super('NexusOfflineDB');
    this.version(1).stores({
      products: 'id, sku, name, categoryId',
      customers: 'id, name, phone',
      salesQueue: '++id, createdAt'
    });
  }
}

export const db = new NexusDB();
