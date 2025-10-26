import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Product, Supplier, Customer, Sale, Employee, SaleItem, PaymentMethod, PaymentStatus, Supply, StockUpdate } from '../types';

// MOCK DATA
const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'Global Foods Ltd.', contactPerson: 'John Doe', phone: '123-456-7890', itemsSupplied: ['Apples', 'Oranges'] },
    { id: 'sup2', name: 'Tech Gadgets Inc.', contactPerson: 'Jane Smith', phone: '098-765-4321', itemsSupplied: ['Laptop', 'Mouse'] },
];

const initialProducts: Product[] = [
    { id: 'prod1', name: 'Apple', price: 1.2, stock: 150, supplierId: 'sup1', createdAt: new Date() },
    { id: 'prod2', name: 'Orange', price: 0.8, stock: 200, supplierId: 'sup1', createdAt: new Date() },
    { id: 'prod3', name: 'Laptop', price: 1200, stock: 30, supplierId: 'sup2', createdAt: new Date() },
    { id: 'prod4', name: 'Mouse', price: 25, stock: 100, supplierId: 'sup2', createdAt: new Date() },
];

const initialCustomers: Customer[] = [
    { id: 'cust1', name: 'Local Cafe', type: 'credit', phone: '555-1111', email: 'cafe@local.com', creditBalance: 250 },
    { id: 'cust2', name: 'Corporate Office', type: 'invoice', phone: '555-2222', email: 'office@corp.com', creditBalance: 0 },
];

const initialEmployees: Employee[] = [
    { id: 'emp1', name: 'Admin User', role: 'admin', permissions: { canAccessAccounting: true, canAccessAnalytics: true, canManageEmployees: true } },
    { id: 'emp2', name: 'Jane Employee', role: 'employee', permissions: { canAccessAccounting: true, canAccessAnalytics: false, canManageEmployees: false } },
];

const initialSales: Sale[] = [
    { id: 'sale1', employeeId: 'emp2', customerId: 'cust1', items: [{ productId: 'prod1', quantity: 50, unitCost: 1.2 }], total: 60, paymentMethod: 'cash', paymentStatus: 'credit', date: new Date(Date.now() - 86400000 * 2), receiptNumber: 'R-001' },
    { id: 'sale2', employeeId: 'emp2', customerId: 'cust2', items: [{ productId: 'prod3', quantity: 2, unitCost: 1200 }], total: 2400, paymentMethod: 'card', paymentStatus: 'invoice', date: new Date(Date.now() - 86400000 * 5), receiptNumber: 'R-002', invoiceDetails: { invoiceNumber: 'INV-001' } },
    { id: 'sale3', employeeId: 'emp2', items: [{ productId: 'prod2', quantity: 10, unitCost: 0.8 }], total: 8, paymentMethod: 'mobile', paymentStatus: 'paid', date: new Date(), receiptNumber: 'R-003' },
];

interface InventoryContextType {
    products: Product[];
    suppliers: Supplier[];
    customers: Customer[];
    sales: Sale[];
    employees: Employee[];
    supplies: Supply[];
    stockUpdates: StockUpdate[];
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
    updateProductStock: (productId: string, quantityChange: number, reason?: StockUpdate['reason']) => void;
    addSale: (saleData: { items: SaleItem[], paymentMethod: PaymentMethod, paymentStatus: PaymentStatus, customerId?: string, invoiceDetails?: {invoiceNumber: string} }) => Sale;
    addCustomer: (customer: Omit<Customer, 'id' | 'creditBalance'>) => void;
    addEmployee: (employee: Omit<Employee, 'id'>) => void;
    deleteEmployee: (employeeId: string) => void;
    addSupply: (supply: Omit<Supply, 'id' | 'date'>) => void;
    getProductName: (id: string) => string;
    getCustomerName: (id: string) => string;
    getEmployeeName: (id: string) => string;
    getSupplierName: (id: string) => string;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// FIX: Switched to an explicit interface for props to resolve a TypeScript error where the 'children' prop was not being correctly identified.
interface InventoryProviderProps {
    children: ReactNode;
}

export const InventoryProvider = ({ children }: InventoryProviderProps) => {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [sales, setSales] = useState<Sale[]>(initialSales);
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);

    const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
        setProducts(prev => [...prev, { ...product, id: `prod${prev.length + 1}`, createdAt: new Date() }]);
    };
    
    const updateProductStock = (productId: string, quantityChange: number, reason: StockUpdate['reason'] = 'correction') => {
        let previousStock = 0;
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                previousStock = p.stock;
                return { ...p, stock: p.stock + quantityChange };
            }
            return p;
        }));

        const newUpdate: StockUpdate = { 
            id: `su-${stockUpdates.length + 1}`,
            productId,
            quantityChange,
            previousStock,
            newStock: previousStock + quantityChange,
            date: new Date(),
            reason
        };
        setStockUpdates(prev => [newUpdate, ...prev]);
    };

    const addSale = (saleData: { items: SaleItem[], paymentMethod: PaymentMethod, paymentStatus: PaymentStatus, customerId?: string, invoiceDetails?: {invoiceNumber: string} }): Sale => {
        const total = saleData.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
        const newSale: Sale = {
            id: `sale${sales.length + 1}`,
            employeeId: 'emp1', // Assume current user is admin
            ...saleData,
            total,
            date: new Date(),
            receiptNumber: `R-00${sales.length + 1}`
        };

        // Decrease stock
        newSale.items.forEach(item => {
            updateProductStock(item.productId, -item.quantity, 'sale');
        });
        
        // Update customer credit if it's a credit sale
        if (newSale.paymentStatus === 'credit' && newSale.customerId) {
            setCustomers(prev => prev.map(c => 
                c.id === newSale.customerId ? { ...c, creditBalance: c.creditBalance + newSale.total } : c
            ));
        }

        setSales(prev => [newSale, ...prev]);
        return newSale;
    };
    
    const addCustomer = (customer: Omit<Customer, 'id' | 'creditBalance'>) => {
        setCustomers(prev => [...prev, { ...customer, id: `cust${prev.length + 1}`, creditBalance: 0 }]);
    };
    
    const addEmployee = (employee: Omit<Employee, 'id'>) => {
        setEmployees(prev => [...prev, { ...employee, id: `emp${prev.length + 1}` }]);
    };
    
    const deleteEmployee = (employeeId: string) => {
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
    };

    const addSupply = (supply: Omit<Supply, 'id' | 'date'>) => {
        const newSupply: Supply = {
            ...supply,
            id: `sup-${supplies.length + 1}`,
            date: new Date()
        };
        setSupplies(prev => [newSupply, ...prev]);
        updateProductStock(supply.productId, supply.quantity, 'new_supply');
    };

    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
    const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Walk-in Customer';
    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown Employee';
    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';

    const value = {
        products, suppliers, customers, sales, employees, supplies, stockUpdates,
        addProduct, updateProductStock, addSale, addCustomer, addEmployee, deleteEmployee, addSupply,
        getProductName, getCustomerName, getEmployeeName, getSupplierName
    };

    return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};