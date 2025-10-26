export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  supplierId: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  itemsSupplied: string[];
}

export interface Supply {
  id: string;
  supplierId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  date: Date;
}

export interface Customer {
  id: string;
  name: string;
  type: 'credit' | 'invoice';
  phone: string;
  email: string;
  creditBalance: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export type PaymentMethod = 'cash' | 'mobile' | 'card';
export type PaymentStatus = 'paid' | 'credit' | 'invoice';

export interface Sale {
  id: string;
  employeeId: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  date: Date;
  receiptNumber: string;
  invoiceDetails?: {
    invoiceNumber: string;
  };
}

export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  permissions: {
    canAccessAccounting: boolean;
    canAccessAnalytics: boolean;
    canManageEmployees: boolean;
  };
}

export type Page = 'dashboard' | 'sales' | 'accounting' | 'credits' | 'products' | 'suppliers' | 'analytics' | 'account';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface StockUpdate {
  id: string;
  productId: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  date: Date;
  reason: 'sale' | 'correction' | 'new_supply';
}