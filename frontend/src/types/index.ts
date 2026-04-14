export type UserRole = 'ADMIN' | 'CASHIER' | 'MANAGER' | 'STAFF' | 'SUPERADMIN';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  businessId?: number;
  isActive?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: number;
  category?: Category;
  price?: number; // Optional as backend might use sellPrice
  sellPrice: number;
  wholesalePrice?: number;
  costPrice?: number;
  stock: number;
  stocks?: { warehouseId: number; quantity: number }[];
  unit: string;
  minStock: number;
  image?: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt?: string;
}

export interface WarehouseTransaction {
  id: number;
  type: 'IN' | 'OUT' | 'ADJUST_IN' | 'ADJUST_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  productId: number;
  product?: Product;
  quantity: number;
  reason?: string;
  userId: number;
  user?: User;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  region?: string;
  type?: 'individual' | 'company';
  balance: number;
  totalOrders?: number;
  createdAt: string;
  isActive?: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  companyName?: string;
  category?: string;
  region?: string;
  address?: string;
  balance: number;
  debt?: number;
  createdAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: number;
  customerId?: number;
  customer?: Customer;
  userId: number;
  user?: User;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'DEBT';
  status: 'COMPLETED' | 'CANCELLED';
  items?: SaleItem[];
  createdAt: string;
}

export interface Order {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  expectedDate?: string;
  receivedDate?: string;
  createdAt: string;
}

export interface Staff {
  id: number;
  name: string;
  phone: string;
  role: UserRole;
  salary: number;
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  _count?: {
    stocks: number;
  };
  createdAt?: string;
}
export interface RecipeItem {
  id: number;
  recipeId: number;
  productId: number;
  product?: Product;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  productId: number;
  product?: Product;
  items?: RecipeItem[];
  _count?: {
    productions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Production {
  id: number;
  recipeId: number;
  recipe?: Recipe;
  quantity: number;
  status: 'completed' | 'planned' | 'in_progress' | 'cancelled';
  userId: number;
  user?: User;
  warehouseId: number;
  warehouse?: Warehouse;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStock {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  product?: Product;
  warehouse?: Warehouse;
}
