import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
// FIX: The errors indicate a mismatch between Firebase SDK version (likely v8) and the code's import syntax (v9).
// The imports are updated to be compatible with Firebase v8, and a direct import of firebase is added.
// FIX: Use firebase/compat to support Firebase v8 syntax with a v9+ SDK installation.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { db, auth } from '../firebase'; // Import Firebase config
import type { 
    Product, Supplier, Customer, Sale, Employee as User, SaleItem, 
    PaymentMethod, PaymentStatus, Supply, StockUpdate, Bill, Payment, 
    ReceiptSettings 
} from '../types';

// FIX: Define types and constants from the firebase v8 SDK.
const Timestamp = firebase.firestore.Timestamp;
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
type FirebaseUser = firebase.User;


// Helper to convert Firestore Timestamps to JS Dates in fetched data
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data;
};

interface InventoryContextType {
    currentUser: User | null;
    firebaseUser: FirebaseUser | null;
    isLoadingAuth: boolean;
    checkInitialSetup: () => Promise<boolean>;
    registerAdmin: (email: string, name: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    products: Product[];
    suppliers: Supplier[];
    customers: Customer[];
    sales: Sale[];
    users: User[];
    supplies: Supply[];
    stockUpdates: StockUpdate[];
    bills: Bill[];
    payments: Payment[];
    receiptSettings: ReceiptSettings;
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
    updateProductStock: (productId: string, quantityChange: number, reason?: StockUpdate['reason']) => Promise<void>;
    updateProductPrice: (productId: string, newPrice: number) => Promise<void>;
    updateProductSupplier: (productId: string, newSupplierId: string) => Promise<void>;
    addSale: (saleData: { items: SaleItem[], paymentMethod: PaymentMethod, paymentStatus: PaymentStatus, employeeId: string, customerId?: string, invoiceDetails?: {invoiceNumber: string}, discount?: { type: 'percentage' | 'fixed', value: number }, tax?: { type: 'percentage' | 'fixed', value: number } }) => Promise<Sale>;
    addCustomer: (customer: Omit<Customer, 'id' | 'creditBalance'>) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (userId: string, updatedDetails: Partial<Omit<User, 'id'>>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateAdminDetails: (details: { userId: string, currentPassword?: string, name?: string, email?: string, newPassword?: string }) => Promise<void>;
    addSupply: (supply: Omit<Supply, 'id' | 'date'>) => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplierId: string, updatedDetails: Partial<Omit<Supplier, 'id'>>) => Promise<void>;
    deleteSupplier: (supplierId: string) => Promise<void>;
    receivePayment: (customerId: string, amount: number, employeeId: string) => Promise<Payment>;
    receiveInvoicePayment: (saleId: string, amount: number, employeeId: string) => Promise<Payment>;
    addBill: (bill: Omit<Bill, 'id' | 'status'>) => Promise<void>;
    payBill: (billId: string, employeeId: string) => Promise<void>;
    updateReceiptSettings: (settings: Partial<ReceiptSettings>) => Promise<void>;
    getProductName: (id: string) => string;
    getCustomerName: (id: string) => string;
    getEmployeeName: (id: string) => string;
    getSupplierName: (id: string) => string;
    getPurchaseCost: (productId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
    children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
    // --- FIREBASE STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
        logo: '', footerText: 'Thank you for your business!', fontSize: 'xs',
    });

    // --- AUTHENTICATION STATE ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // --- AUTHENTICATION & DATA FETCHING ---
    useEffect(() => {
        // FIX: Replaced v9 `onAuthStateChanged(auth, ...)` with v8 `auth.onAuthStateChanged(...)`.
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setFirebaseUser(user);
            if (user) {
                // User is signed in, now get their profile from Firestore
                // FIX: Replaced v9 `doc(db, ...)` with v8 `db.collection(...).doc(...)`.
                const userDocRef = db.collection('users').doc(user.uid);
                // FIX: Replaced v9 `onSnapshot(docRef, ...)` with v8 `docRef.onSnapshot(...)`.
                const unsubProfile = userDocRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const userData = convertTimestamps({ id: doc.id, ...doc.data() }) as User;
                        setCurrentUser(userData);
                    } else {
                        // Profile doesn't exist, might be an error or mid-registration
                        setCurrentUser(null);
                    }
                    setIsLoadingAuth(false);
                });
                return () => unsubProfile();
            } else {
                // User is signed out
                setCurrentUser(null);
                setIsLoadingAuth(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect to set up real-time listeners when a user logs in
    useEffect(() => {
        if (!currentUser) {
            // Clear all data if user logs out
            setProducts([]); setSuppliers([]); setCustomers([]); setSales([]);
            setUsers([]); setSupplies([]); setStockUpdates([]); setBills([]); setPayments([]);
            return;
        };

        const collections = {
            products: setProducts,
            suppliers: setSuppliers,
            customers: setCustomers,
            sales: setSales,
            supplies: setSupplies,
            stockUpdates: setStockUpdates,
            bills: setBills,
            payments: setPayments,
            // Users are only fetched if admin
        };

        const unsubscribers = Object.entries(collections).map(([name, setter]) => {
            // FIX: Replaced v9 `query(collection(db, name))` with v8 `db.collection(name)`.
            const q = db.collection(name);
            // FIX: Replaced v9 `onSnapshot(q, ...)` with v8 `q.onSnapshot(...)`.
            return q.onSnapshot((querySnapshot) => {
                const data = querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
                setter(data as any);
            });
        });
        
        // Fetch users only if current user is an admin
        if (currentUser.permissions.canManageEmployees) {
            // FIX: Replaced v9 `query(collection(db, 'users'))` with v8 `db.collection('users')`.
            const usersQuery = db.collection('users');
            // FIX: Replaced v9 `onSnapshot(usersQuery, ...)` with v8 `usersQuery.onSnapshot(...)`.
            const unsubUsers = usersQuery.onSnapshot((querySnapshot) => {
                const usersData = querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as User[];
                setUsers(usersData);
            });
            unsubscribers.push(unsubUsers);
        }

        // Fetch settings
        // FIX: Replaced v9 `doc(db, ...)` with v8 `db.collection(...).doc(...)`.
        const settingsDocRef = db.collection('settings').doc('receipt');
        // FIX: Replaced v9 `onSnapshot(settingsDocRef, ...)` with v8 `settingsDocRef.onSnapshot(...)`.
        const unsubSettings = settingsDocRef.onSnapshot((doc) => {
            if (doc.exists) {
                setReceiptSettings(doc.data() as ReceiptSettings);
            }
        });
        unsubscribers.push(unsubSettings);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [currentUser]);

    const checkInitialSetup = async (): Promise<boolean> => {
        // FIX: Replaced v9 `query(collection(db, "users"))` with v8 `db.collection("users")`.
        const usersQuery = db.collection("users");
        // FIX: Replaced v9 `getDocs(usersQuery)` with v8 `usersQuery.get()`.
        const querySnapshot = await usersQuery.get();
        return querySnapshot.empty;
    };
    
    const registerAdmin = async (email: string, name: string, password: string): Promise<void> => {
        // FIX: Replaced v9 `createUserWithEmailAndPassword(auth, ...)` with v8 `auth.createUserWithEmailAndPassword(...)`.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (!user) {
            throw new Error("User could not be created.");
        }
        // FIX: Replaced v9 `updateProfile(user, ...)` with v8 `user.updateProfile(...)`.
        await user.updateProfile({ displayName: name });

        const adminProfile: Omit<User, 'id'> = {
            name,
            email,
            role: 'admin',
            permissions: {
                canManageEmployees: true,
                dashboard: true, sales: true, accounting: true, credits: true, payments: true, products: true, suppliers: true, analytics: true, account: true
            }
        };
        // Use user.uid as the document ID
        // FIX: Replaced v9 `setDoc(doc(db, ...), ...)` with v8 `db.collection(...).doc(...).set(...)`.
        await db.collection('users').doc(user.uid).set(adminProfile);
    };

    const login = async (email: string, password: string): Promise<void> => {
        // FIX: Replaced v9 `signInWithEmailAndPassword(auth, ...)` with v8 `auth.signInWithEmailAndPassword(...)`.
        await auth.signInWithEmailAndPassword(email, password);
    };

    const logout = async (): Promise<void> => {
        // FIX: Replaced v9 `signOut(auth)` with v8 `auth.signOut()`.
        await auth.signOut();
    };

    // --- DATA MANAGEMENT ---
    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const employeeMap = useMemo(() => new Map(users.map(e => [e.id, e])), [users]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

    const getPurchaseCost = (productId: string): number => {
        const productSupplies = supplies
            .filter(s => s.productId === productId)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
        
        if (productSupplies.length > 0) return productSupplies[0].unitCost;
        const product = productMap.get(productId);
        return product ? product.price * 0.7 : 0;
    };
    
    // --- CREATE, UPDATE, DELETE OPERATIONS ---
    
    const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
        // FIX: Replaced v9 `addDoc(collection(...), ...)` with v8 `db.collection(...).add(...)`.
        // FIX: Replaced v9 `serverTimestamp()` with v8 `serverTimestamp`.
        const docRef = await db.collection('products').add({ ...product, createdAt: serverTimestamp() });
        const newProduct = { ...product, id: docRef.id, createdAt: new Date() };
        if (newProduct.stock > 0) {
            // FIX: Replaced v9 `addDoc(collection(...), ...)` with v8 `db.collection(...).add(...)`.
            // FIX: Replaced v9 `serverTimestamp()` with v8 `serverTimestamp`.
            await db.collection('stockUpdates').add({
                productId: newProduct.id,
                quantityChange: newProduct.stock,
                previousStock: 0,
                newStock: newProduct.stock,
                date: serverTimestamp(),
                reason: 'new_supply'
            });
        }
        return newProduct;
    };

    const updateProductStock = async (productId: string, quantityChange: number, reason: StockUpdate['reason'] = 'correction') => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const previousStock = product.stock;
        const newStock = previousStock + quantityChange;

        // FIX: Replaced v9 `writeBatch(db)` with v8 `db.batch()`.
        const batch = db.batch();
        // FIX: Replaced v9 `batch.update(doc(...), ...)` with v8 `batch.update(db.collection(...).doc(...), ...)`.
        batch.update(db.collection('products').doc(productId), { stock: newStock });
        // FIX: Replaced v9 `batch.set(doc(collection(...)), ...)` with v8 `batch.set(db.collection(...).doc(), ...)`.
        // FIX: Replaced v9 `serverTimestamp()` with v8 `serverTimestamp`.
        batch.set(db.collection('stockUpdates').doc(), {
            productId, quantityChange, previousStock, newStock, date: serverTimestamp(), reason
        });
        await batch.commit();
    };

    const updateProductPrice = (productId: string, newPrice: number) => {
        // FIX: Replaced v9 `updateDoc(doc(...), ...)` with v8 `db.collection(...).doc(...).update(...)`.
        return db.collection('products').doc(productId).update({ price: newPrice });
    };

    const updateProductSupplier = (productId: string, newSupplierId: string) => {
        // FIX: Replaced v9 `updateDoc(doc(...), ...)` with v8 `db.collection(...).doc(...).update(...)`.
        return db.collection('products').doc(productId).update({ supplierId: newSupplierId });
    };

    const addSale = async (saleData: { items: SaleItem[], paymentMethod: PaymentMethod, paymentStatus: PaymentStatus, employeeId: string, customerId?: string, invoiceDetails?: {invoiceNumber: string}, discount?: { type: 'percentage' | 'fixed', value: number }, tax?: { type: 'percentage' | 'fixed', value: number } }): Promise<Sale> => {
        // 1. Calculate totals before discounts
        const subtotal = saleData.items.reduce((acc, item) => acc + (item.quantity * item.salePrice), 0);
        
        // 2. Calculate item-level discounts
        const itemDiscountsTotal = saleData.items.reduce((acc, item) => {
            if (!item.discount || item.discount.value <= 0) return acc;
            const itemTotal = item.salePrice * item.quantity;
            return acc + (item.discount.type === 'fixed' ? Math.min(item.discount.value, itemTotal) : (itemTotal * (item.discount.value / 100)));
        }, 0);
        const totalAfterItemDiscounts = subtotal - itemDiscountsTotal;

        // 3. Calculate cart-level discount to get the pre-tax total
        let totalBeforeTax = totalAfterItemDiscounts;
        if (saleData.discount && saleData.discount.value > 0) {
            totalBeforeTax = saleData.discount.type === 'fixed' 
                ? Math.max(0, totalAfterItemDiscounts - saleData.discount.value) 
                : totalAfterItemDiscounts * (1 - saleData.discount.value / 100);
        }
        
        // 4. Calculate tax based on the post-discount total
        let taxAmount = 0;
        let taxDetails: Sale['tax'] | undefined = undefined;
        if (saleData.tax && saleData.tax.value > 0) {
            if (saleData.tax.type === 'fixed') {
                taxAmount = saleData.tax.value;
            } else { // percentage
                taxAmount = totalBeforeTax * (saleData.tax.value / 100);
            }
            taxDetails = { ...saleData.tax, amount: taxAmount };
        }

        // 5. Calculate final total and profit
        const finalTotal = totalBeforeTax + taxAmount;
        const totalCost = saleData.items.reduce((acc, item) => acc + (item.quantity * item.purchaseCost), 0);
        const profit = totalBeforeTax - totalCost; // Profit is calculated on the pre-tax amount

        // 6. Generate receipt number
        // FIX: Replaced v9 `query(collection(...), where(...))` with v8 `db.collection(...).where(...)`.
        const salesTodayQuery = db.collection('sales').where('date', '>=', new Date(new Date().setHours(0,0,0,0)));
        // FIX: Replaced v9 `getDocs(...)` with v8 `query.get()`.
        const salesTodaySnapshot = await salesTodayQuery.get();
        const todayCount = salesTodaySnapshot.size;
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        const now = new Date();
        const datePrefix = `R-${now.getFullYear().toString().slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
        const newReceiptNumber = `${datePrefix}-${(todayCount + 1).toString().padStart(3, '0')}`;

        // 7. Prepare the sale object for saving
        const { tax, ...restOfSaleData } = saleData; // Exclude the raw tax value from the root
        const saleToSave = { 
            ...restOfSaleData, 
            total: finalTotal, 
            totalCost, 
            profit, 
            tax: taxDetails, 
            date: serverTimestamp(), 
            receiptNumber: newReceiptNumber 
        };
        // FIX: Replaced v9 `addDoc(collection(...), ...)` with v8 `db.collection(...).add(...)`.
        const docRef = await db.collection('sales').add(saleToSave);

        // 8. Update stock and customer balances in a batch
        // FIX: Replaced v9 `writeBatch(db)` with v8 `db.batch()`.
        const batch = db.batch();
        saleData.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if(product) {
                const newStock = product.stock - item.quantity;
                // FIX: `batch.update(doc(...))` to `batch.update(db.collection(...).doc(...))`
                batch.update(db.collection('products').doc(item.productId), { stock: newStock });
                // FIX: `batch.set(doc(collection(...)))` to `batch.set(db.collection(...).doc())`
                batch.set(db.collection('stockUpdates').doc(), {
                    productId: item.productId, quantityChange: -item.quantity, previousStock: product.stock, newStock, date: serverTimestamp(), reason: 'sale'
                });
            }
        });
        
        if ((saleData.paymentStatus === 'credit' || saleData.paymentStatus === 'invoice') && saleData.customerId) {
            const customer = customers.find(c => c.id === saleData.customerId);
            if (customer) {
                // FIX: `batch.update(doc(...))` to `batch.update(db.collection(...).doc(...))`
                batch.update(db.collection('customers').doc(saleData.customerId), { creditBalance: customer.creditBalance + finalTotal });
            }
        }
        await batch.commit();

        return { ...saleToSave, id: docRef.id, date: new Date() } as Sale;
    };
    
    const addCustomer = (customer: Omit<Customer, 'id' | 'creditBalance'>) => {
        // FIX: `addDoc(collection(...))` to `db.collection(...).add()`
        return db.collection('customers').add({ ...customer, creditBalance: 0 });
    };

    const addUser = async (user: Omit<User, 'id' | 'email'> & { email: string; password?: string }) => {
        // Check for username uniqueness
        const trimmedName = user.name.trim();
        const usersQuery = db.collection('users').where('name', '==', trimmedName).limit(1);
        const snapshot = await usersQuery.get();
        if (!snapshot.empty) {
            throw new Error("Username is already taken.");
        }
    
        // NOTE: Firebase Admin SDK is needed to create users programmatically without logging them in.
        // This is a client-side approximation and is NOT SECURE for production.
        if (!user.password) throw new Error("Password is required to create a user.");
        const cred = await auth.createUserWithEmailAndPassword(user.email, user.password);
        if (!cred.user) throw new Error("Could not create user.");
        await cred.user.updateProfile({ displayName: trimmedName });
        
        const { password, ...profileData } = user;
        const profile = { ...profileData, name: trimmedName };

        await db.collection('users').doc(cred.user.uid).set(profile);
    };

    const updateUser = async (userId: string, updatedDetails: Partial<Omit<User, 'id'>>) => {
        // If name is being updated, check for uniqueness
        if (updatedDetails.name) {
            const trimmedName = updatedDetails.name.trim();
            if (trimmedName) {
                const usersQuery = db.collection('users').where('name', '==', trimmedName).limit(1);
                const snapshot = await usersQuery.get();
                if (!snapshot.empty && snapshot.docs[0].id !== userId) {
                    throw new Error("Username is already taken.");
                }
                updatedDetails.name = trimmedName; // Use trimmed name
            }
        }
        // FIX: `updateDoc(doc(...), ...)` to `db.collection(...).doc(...).update(...)`
        return db.collection('users').doc(userId).update(updatedDetails);
    };

    const deleteUser = (userId: string) => {
        // NOTE: Deleting users requires Firebase Admin SDK. This is a client-side approximation.
        // FIX: `deleteDoc(doc(...))` to `db.collection(...).doc(...).delete()`
        return db.collection('users').doc(userId).delete();
    };
    
    const updateAdminDetails = async (details: { userId: string, currentPassword?: string, name?: string, email?: string, newPassword?: string }) => {
        if (!firebaseUser || !details.currentPassword) throw new Error("Authentication required.");
        
        // FIX: `EmailAuthProvider.credential(...)` to `firebase.auth.EmailAuthProvider.credential(...)`
        const credential = firebase.auth.EmailAuthProvider.credential(firebaseUser.email!, details.currentPassword);
        // FIX: `reauthenticateWithCredential(firebaseUser, ...)` to `firebaseUser.reauthenticateWithCredential(...)`
        await firebaseUser.reauthenticateWithCredential(credential);

        if (details.name && details.name.trim() !== firebaseUser.displayName) {
            const trimmedName = details.name.trim();
            // Check for username uniqueness
            const usersQuery = db.collection('users').where('name', '==', trimmedName).limit(1);
            const snapshot = await usersQuery.get();
            if (!snapshot.empty && snapshot.docs[0].id !== details.userId) {
                throw new Error("Username is already taken.");
            }
    
            // FIX: `updateProfile(firebaseUser, ...)` to `firebaseUser.updateProfile(...)`
            await firebaseUser.updateProfile({ displayName: trimmedName });
            // FIX: `updateDoc(doc(...), ...)` to `db.collection(...).doc(...).update(...)`
            await db.collection('users').doc(details.userId).update({ name: trimmedName });
        }
        if (details.email && details.email !== firebaseUser.email) {
            // await updateEmail(firebaseUser, details.email); // requires verification
            throw new Error("Email update is not supported in this version.");
        }
        if (details.newPassword) {
            // FIX: `updatePassword(firebaseUser, ...)` to `firebaseUser.updatePassword(...)`
            await firebaseUser.updatePassword(details.newPassword);
        }
    };
    
    const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
        // FIX: `addDoc(collection(...))` to `db.collection(...).add()`
        return db.collection('suppliers').add(supplier);
    };

    const updateSupplier = (supplierId: string, updatedDetails: Partial<Omit<Supplier, 'id'>>) => {
        // FIX: `updateDoc(doc(...), ...)` to `db.collection(...).doc(...).update(...)`
        return db.collection('suppliers').doc(supplierId).update(updatedDetails);
    };

    const deleteSupplier = (supplierId: string) => {
        // FIX: `deleteDoc(doc(...))` to `db.collection(...).doc(...).delete()`
        return db.collection('suppliers').doc(supplierId).delete();
    };

    const addSupply = async (supply: Omit<Supply, 'id' | 'date'>) => {
        const supplyWithDate = { ...supply, date: serverTimestamp() };
        // FIX: `addDoc(collection(...))` to `db.collection(...).add()`
        await db.collection('supplies').add(supplyWithDate);
        await updateProductStock(supply.productId, supply.quantity, 'new_supply');
    };

    const receivePayment = async (customerId: string, amount: number, employeeId: string): Promise<Payment> => {
        const customer = customers.find(c => c.id === customerId);
        if(!customer) throw new Error("Customer not found");
        
        const newBalance = Math.max(0, customer.creditBalance - amount);
        // FIX: `query(collection(...))` to `db.collection(...)`
        const paymentsQuery = db.collection('payments');
        // FIX: `getDocs(...)` to `query.get()`
        const paymentsSnapshot = await paymentsQuery.get();
        const paymentId = `P-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${paymentsSnapshot.size + 1}`;

        const newPaymentData = { 
            id: paymentId, referenceId: customerId, amount, date: serverTimestamp(), type: 'inbound_customer' as const, 
            description: `Payment from ${customer.name}`, employeeId, balanceAfterPayment: newBalance 
        };

        const batch = db.batch();
        batch.update(db.collection('customers').doc(customerId), { creditBalance: newBalance });
        batch.set(db.collection('payments').doc(), newPaymentData);
        await batch.commit();

        return { ...newPaymentData, date: new Date() };
    };

    const receiveInvoicePayment = async (saleId: string, amount: number, employeeId: string): Promise<Payment> => {
        const sale = sales.find(s => s.id === saleId);
        if (!sale || !sale.customerId) throw new Error("Invoice or associated customer not found.");
        
        const customer = customers.find(c => c.id === sale.customerId);
        if(!customer) throw new Error("Customer not found");

        const newBalance = Math.max(0, customer.creditBalance - amount);
        const paymentsQuery = db.collection('payments');
        const paymentsSnapshot = await paymentsQuery.get();
        const paymentId = `P-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${paymentsSnapshot.size + 1}`;

        const newPaymentData = { 
            id: paymentId, referenceId: sale.customerId, amount, date: serverTimestamp(), type: 'inbound_customer' as const, 
            description: `Payment for Invoice #${sale.invoiceDetails?.invoiceNumber || sale.receiptNumber}`, 
            employeeId, balanceAfterPayment: newBalance 
        };

        const batch = db.batch();
        batch.update(db.collection('customers').doc(sale.customerId), { creditBalance: newBalance });
        if (amount >= sale.total) {
            batch.update(db.collection('sales').doc(saleId), { paymentStatus: 'paid' });
        }
        batch.set(db.collection('payments').doc(), newPaymentData);
        await batch.commit();

        return { ...newPaymentData, date: new Date() };
    };
    
    const addBill = (billData: Omit<Bill, 'id' | 'status'>) => {
        return db.collection('bills').add({ ...billData, status: 'unpaid' });
    };

    const payBill = async (billId: string, employeeId: string) => {
        const billToPay = bills.find(b => b.id === billId);
        if (!billToPay) return;
        
        const paymentsQuery = db.collection('payments');
        const paymentsSnapshot = await paymentsQuery.get();
        const paymentId = `P-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${paymentsSnapshot.size + 1}`;

        const newPayment = { 
            id: paymentId, referenceId: billId, amount: billToPay.amount, date: serverTimestamp(), 
            type: 'outbound_bill' as const, description: `Paid bill to ${billToPay.vendor}`, employeeId 
        };

        const batch = db.batch();
        batch.update(db.collection('bills').doc(billId), { status: 'paid' });
        batch.set(db.collection('payments').doc(), newPayment);

        if (billToPay.isRecurring && billToPay.recurringDetails) {
            const { frequency, period } = billToPay.recurringDetails;
            const nextDueDate = new Date(billToPay.dueDate);
            if (period === 'days') nextDueDate.setDate(nextDueDate.getDate() + frequency);
            else if (period === 'weeks') nextDueDate.setDate(nextDueDate.getDate() + (frequency * 7));
            else if (period === 'months') nextDueDate.setMonth(nextDueDate.getMonth() + frequency);
            
            const { id, ...restOfBill } = billToPay;
            const nextBill = { ...restOfBill, dueDate: nextDueDate, status: 'unpaid' as const };
            batch.set(db.collection('bills').doc(), nextBill);
        }
        await batch.commit();
    };

    const updateReceiptSettings = (settings: Partial<ReceiptSettings>) => {
        // FIX: `setDoc(doc(...), ...)` to `db.collection(...).doc(...).set(...)`
        return db.collection('settings').doc('receipt').set(settings, { merge: true });
    };

    const value: InventoryContextType = {
        currentUser, firebaseUser, isLoadingAuth, checkInitialSetup, registerAdmin, login, logout,
        products, suppliers, customers, sales, users, supplies, stockUpdates, bills, payments, receiptSettings,
        addProduct, updateProductStock, updateProductPrice, updateProductSupplier, addSale, addCustomer, addUser, updateUser, deleteUser, updateAdminDetails,
        addSupply, addSupplier, updateSupplier, deleteSupplier, receivePayment, receiveInvoicePayment, addBill, payBill, updateReceiptSettings,
        getProductName: (id: string) => productMap.get(id)?.name || 'Unknown',
        getCustomerName: (id: string) => customerMap.get(id)?.name || 'Walk-in',
        getEmployeeName: (id: string) => employeeMap.get(id)?.name || 'Unknown',
        getSupplierName: (id: string) => supplierMap.get(id)?.name || 'Unknown',
        getPurchaseCost
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
