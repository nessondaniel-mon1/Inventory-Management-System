export type Page =
    | 'dashboard'
    | 'sales'
    | 'accounting'
    | 'credits'
    | 'payments'
    | 'products'
    | 'suppliers'
    | 'analytics'
    | 'account';

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

export type CustomerType = 'credit' | 'invoice';
export interface Customer {
    id:string;
    name: string;
    type: CustomerType;
    phone: string;
    address: string;
    creditBalance: number;
}

export type UserRole = 'admin' | 'employee';
export interface UserPermissions {
    canManageEmployees: boolean;
    dashboard: boolean;
    sales: boolean;
    accounting: boolean;
    credits: boolean;
    payments: boolean;
    products: boolean;
    suppliers: boolean;
    analytics: boolean;
    account: boolean;
}
export interface Employee { // Renamed to User conceptually, but keeping Employee for minimal diff
    id: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: UserPermissions;
}

export interface SaleItem {
    productId: string;
    quantity: number;
    salePrice: number; // The price per unit at the time of sale
    purchaseCost: number; // The cost per unit for the business
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
    };
}

export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'paid' | 'credit' | 'invoice';

export interface Sale {
    id: string;
    employeeId: string;
    customerId?: string;
    items: SaleItem[];
    total: number;
    totalCost: number;
    profit: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    date: Date;
    receiptNumber: string;
    invoiceDetails?: {
        invoiceNumber: string;
    };
    discount?: {
        type: 'percentage' | 'fixed';
        value: number;
    };
    tax?: {
        type: 'percentage' | 'fixed';
        value: number;
        amount: number;
    };
}

export interface Supply {
    id: string;
    supplierId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    date: Date;
    receiptNumber?: string;
}

export interface StockUpdate {
    id: string;
    productId: string;
    quantityChange: number; // positive for addition, negative for reduction
    previousStock: number;
    newStock: number;
    date: Date;
    reason: 'sale' | 'new_supply' | 'correction' | 'return';
}

export interface Bill {
    id: string;
    vendor: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'paid' | 'unpaid';
    category: 'Utilities' | 'Rent' | 'Services' | 'Supplies' | 'Other';
    isRecurring: boolean;
    recurringDetails?: {
        frequency: number;
        period: 'days' | 'weeks' | 'months';
    };
}

export interface Payment {
    id: string;
    referenceId: string; // Can be customerId or billId
    amount: number;
    date: Date;
    type: 'inbound_customer' | 'outbound_bill';
    description: string;
    employeeId: string;
    balanceAfterPayment?: number;
}

export interface ReceiptSettings {
    logo?: string; // Base64 encoded image
    footerText?: string;
    fontSize?: 'xs' | 'sm' | 'base'; // Corresponds to Tailwind classes
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface ForecastDataPoint {
    name: string;
    sales: number | null;
    profit: number | null;
    forecastSales?: number;
    forecastProfit?: number;
}

export interface ReorderSuggestion {
    productId: string;
    productName: string;
    currentStock: number;
    predictedDaysRemaining: number;
    suggestedReorderQuantity: number;
}

export interface SegmentedCustomer {
    id: string;
    name: string;
    value: number; // Can be total spend or number of purchases
}

export interface ExtractedData {
    products?: Array<Omit<Product, 'id' | 'createdAt' | 'supplierId'> & { supplierId?: string }>;
    suppliers?: Array<Omit<Supplier, 'id'>>;
    customers?: Array<Omit<Customer, 'id' | 'creditBalance'>>;
    bills?: Array<Omit<Bill, 'id' | 'status' | 'dueDate'> & { dueDate: string }>;
}