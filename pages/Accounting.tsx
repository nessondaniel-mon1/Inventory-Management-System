import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { SaleItem, Product, PaymentMethod, PaymentStatus, Sale, ReceiptSettings } from '../types';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" y2="17"/><line x1="14" y1="11" y2="17"/></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432L12.586 2.586z"/><circle cx="7.5" cy="7.5" r="1"/></svg>

interface PrintableReceiptProps {
    sale: Sale;
    getProductName: (id: string) => string;
    getCustomerName: (id: string) => string;
    getEmployeeName: (id: string) => string;
    receiptSettings: ReceiptSettings;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, getProductName, getCustomerName, getEmployeeName, receiptSettings }) => {
    const subtotal = sale.items.reduce((acc, item) => acc + item.quantity * item.salePrice, 0);

    const calculateItemDiscountAmount = (item: SaleItem) => {
        if (!item.discount || item.discount.value <= 0) return 0;
        const itemTotal = item.salePrice * item.quantity;
        if (item.discount.type === 'fixed') {
            return Math.min(item.discount.value, itemTotal);
        } else {
            return itemTotal * (item.discount.value / 100);
        }
    };

    const totalItemDiscounts = sale.items.reduce((acc, item) => acc + calculateItemDiscountAmount(item), 0);
    const totalBeforeTax = sale.total - (sale.tax?.amount || 0);
    const totalAfterItemDiscounts = subtotal - totalItemDiscounts;
    const totalCartDiscount = totalAfterItemDiscounts - totalBeforeTax;

    return (
        <div className={`printable-receipt p-2 font-mono text-black bg-white text-${receiptSettings.fontSize || 'xs'}`}>
            <div className="text-center">
                {receiptSettings.logo && <img src={receiptSettings.logo} alt="logo" className="max-h-16 mx-auto mb-2" />}
                <h2 className="text-base font-bold">INVENTORY PRO</h2>
                <p className="text-[10px]">123 Business Rd, Commerce City, 12345</p>
                <p className="text-[10px]">Tel: (123) 456-7890</p>
                <hr className="my-1 border-dashed border-black" />
            </div>
            <div className="text-[10px] space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Receipt:</span>
                    <span className="text-right truncate">{sale.receiptNumber}</span>
                </div>
                {sale.paymentStatus === 'invoice' && sale.invoiceDetails?.invoiceNumber && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Invoice:</span>
                        <span className="text-right truncate">{sale.invoiceDetails.invoiceNumber}</span>
                    </div>
                )}
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Date:</span>
                    <span className="text-right truncate">{new Date(sale.date).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Cashier:</span>
                    <span className="text-right truncate">{getEmployeeName(sale.employeeId)}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Customer:</span>
                    <span className="text-right truncate">{sale.customerId ? getCustomerName(sale.customerId) : 'Walk-in'}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            
            <div className="my-1">
                 {sale.items.map(item => (
                    <div key={item.productId} className="py-0.5 border-b border-dashed border-black last:border-b-0">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center">
                            <span className="truncate" title={getProductName(item.productId)}>
                                {getProductName(item.productId)}
                            </span>
                            <span className="text-center">{item.quantity}x</span>
                            <span className="text-right">@${item.salePrice.toFixed(2)}</span>
                            <span className="text-right font-semibold">${(item.quantity * item.salePrice).toFixed(2)}</span>
                        </div>
                        {item.discount && item.discount.value > 0 && (
                            <div className="pl-4 text-gray-600 text-[9px] grid grid-cols-[1fr_auto]">
                                <span>Discount ({item.discount.type === 'fixed' ? `$${item.discount.value.toFixed(2)}` : `${item.discount.value}%`})</span>
                                <span className="text-right">-${(calculateItemDiscountAmount(item)).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <hr className="my-1 border-dashed border-black" />
            <div className="text-xs space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Subtotal:</span>
                    <span className="text-right">${subtotal.toFixed(2)}</span>
                </div>
                {totalItemDiscounts > 0.001 && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Item Discounts:</span>
                        <span className="text-right">-${totalItemDiscounts.toFixed(2)}</span>
                    </div>
                )}
                 {totalCartDiscount > 0.001 && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Order Discount:</span>
                        <span className="text-right">-${totalCartDiscount.toFixed(2)}</span>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Tax ({sale.tax ? (sale.tax.type === 'fixed' ? 'Fixed' : `${sale.tax.value}%`) : '0%'}):</span>
                    <span className="text-right">${(sale.tax?.amount || 0).toFixed(2)}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2 font-bold text-base mt-1">
                    <span>TOTAL:</span>
                    <span className="text-right">${sale.total.toFixed(2)}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="text-[10px]">
                <p className="font-semibold text-center uppercase">Payment Details</p>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Method:</span>
                    <span className="capitalize text-right">{sale.paymentMethod}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Status:</span>
                    <span className="capitalize font-semibold text-right">{sale.paymentStatus}</span>
                </div>
                {sale.paymentStatus === 'credit' && (
                    <div className="grid grid-cols-2 gap-x-2 mt-1 pt-1 border-t border-dashed border-black font-bold">
                        <span>CHARGED TO ACCOUNT:</span>
                        <span className="text-right">${sale.total.toFixed(2)}</span>
                    </div>
                )}
                {sale.paymentStatus === 'invoice' && (
                    <div className="grid grid-cols-2 gap-x-2 mt-1 pt-1 border-t border-dashed border-black font-bold">
                        <span>AMOUNT DUE:</span>
                        <span className="text-right">${sale.total.toFixed(2)}</span>
                    </div>
                )}
            </div>
            <hr className="my-1 border-dashed border-black" />
             <div className="text-center text-[9px] mt-1 text-gray-500">
                <p>Internal Data:</p>
                <p>COGS: ${sale.totalCost.toFixed(2)} | Profit: ${sale.profit.toFixed(2)}</p>
            </div>
            <p className="text-center text-[10px] mt-1">{receiptSettings.footerText || 'Thank you for your business!'}</p>
        </div>
    );
};

// Define a local cart item type to allow for temporary invalid states during editing
type CartItem = Omit<SaleItem, 'quantity'> & {
    quantity: number | '';
}

interface ItemDiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CartItem;
    productName: string;
    onSave: (productId: string, discount?: { type: 'percentage' | 'fixed', value: number }) => void;
}

const ItemDiscountModal: React.FC<ItemDiscountModalProps> = ({ isOpen, onClose, item, productName, onSave }) => {
    const [type, setType] = useState<'fixed' | 'percentage'>(item.discount?.type || 'fixed');
    const [value, setValue] = useState<number | string>(item.discount?.value || '');
    
    const handleSave = () => {
        const numValue = Number(value);
        if (numValue > 0) {
            onSave(item.productId, { type, value: numValue });
        } else {
            onSave(item.productId, undefined); // Remove discount if value is 0 or empty
        }
        onClose();
    };

    const handleRemove = () => {
        onSave(item.productId, undefined);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Discount for ${productName}`}
            size="md"
            footer={
                <>
                    <Button onClick={handleSave}>Apply Discount</Button>
                    {item.discount && <Button variant="danger" onClick={handleRemove}>Remove Discount</Button>}
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </>
            }
        >
            <div className="space-y-4">
                <p>Set a discount for all units of this item in the cart.</p>
                <div className="flex gap-2">
                    <div className="w-1/3">
                        <Select label="Type" value={type} onChange={e => setType(e.target.value as 'fixed' | 'percentage')}>
                            <option value="fixed">Fixed ($)</option>
                            <option value="percentage">Percent (%)</option>
                        </Select>
                    </div>
                    <div className="w-2/3">
                        <Input 
                            label="Value" 
                            type="number" 
                            value={value} 
                            onChange={e => setValue(e.target.value)}
                            placeholder="0.00" 
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const Accounting: React.FC = () => {
    const { products, customers, addSale, getProductName, sales, getCustomerName, getEmployeeName, receiptSettings, getPurchaseCost, currentUser } = useInventory();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'credit' | 'invoice'>('all');
    
    // Overall cart discount
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState<number | string>('');

    // State for tax
    const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');
    const [taxValue, setTaxValue] = useState<number | string>('');

    // Per-item discount modal state
    const [itemToDiscount, setItemToDiscount] = useState<CartItem | null>(null);

    // This effect syncs the cart with the latest product data (price, stock).
    useEffect(() => {
        setCart(currentCart => {
            const syncedCart = currentCart.map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product || product.stock === 0) return null;
                
                let newItem = { ...item };
                if (product.price !== item.salePrice) newItem.salePrice = product.price;
                if (Number(item.quantity) > product.stock) newItem.quantity = product.stock;

                return newItem;
            }).filter(Boolean) as CartItem[];

            if (JSON.stringify(syncedCart) !== JSON.stringify(currentCart)) return syncedCart;
            return currentCart;
        });
    }, [products]);

    // Effect for toast message auto-dismiss
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5);
    }, [products, productSearch]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        const currentQuantityInCart = existingItem ? Number(existingItem.quantity) : 0;

        if (currentQuantityInCart >= product.stock) {
            setProductSearch('');
            return; // Silently prevent adding more than is in stock.
        }

        setCart(prev => {
            if (existingItem) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: (Number(item.quantity) || 0) + 1 } : item);
            }
            const purchaseCost = getPurchaseCost(product.id);
            return [...prev, { productId: product.id, quantity: 1, salePrice: product.price, purchaseCost }];
        });
        setProductSearch('');
    };

    const updateQuantity = (productId: string, change: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setCart(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQuantity = (Number(item.quantity) || 0) + change;
                    const clampedQuantity = Math.max(1, Math.min(newQuantity, product.stock));
                    return { ...item, quantity: clampedQuantity };
                }
                return item;
            });
        });
    };
    
    const handleQuantityChange = (productId: string, value: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        if (value === '') {
            setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: '' } : item));
        } else {
            const quantity = parseInt(value, 10);
            if (!isNaN(quantity)) {
                const clampedQuantity = Math.max(1, Math.min(quantity, product.stock));
                setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: clampedQuantity } : item));
            }
        }
    };
    
    const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>, productId: string) => {
        if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
            setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: 1 } : item));
        }
    };


    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const handleSaveItemDiscount = (productId: string, discount?: { type: 'percentage' | 'fixed', value: number }) => {
        setCart(prev => prev.map(item => 
            item.productId === productId ? { ...item, discount } : item
        ));
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.quantity) || 0) * item.salePrice, 0), [cart]);
    
    const itemDiscountsTotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            if (!item.discount || item.discount.value <= 0) return acc;
            const itemTotal = item.salePrice * (Number(item.quantity) || 0);
            if (item.discount.type === 'fixed') {
                return acc + Math.min(item.discount.value, itemTotal);
            } else { // percentage
                return acc + (itemTotal * (item.discount.value / 100));
            }
        }, 0);
    }, [cart]);

    const totalAfterItemDiscounts = subtotal - itemDiscountsTotal;
    
    const cartDiscountAmount = useMemo(() => {
        const value = Number(discountValue) || 0;
        if (value <= 0) return 0;
    
        if (discountType === 'fixed') {
            return Math.min(totalAfterItemDiscounts, value);
        } else { // percentage
            return totalAfterItemDiscounts * (value / 100);
        }
    }, [totalAfterItemDiscounts, discountType, discountValue]);

    const totalBeforeTax = useMemo(() => Math.max(0, totalAfterItemDiscounts - cartDiscountAmount), [totalAfterItemDiscounts, cartDiscountAmount]);

    const taxAmount = useMemo(() => {
        const value = Number(taxValue) || 0;
        if (value <= 0) return 0;
        if (taxType === 'fixed') {
            return value;
        } else { // percentage
            return totalBeforeTax * (value / 100);
        }
    }, [totalBeforeTax, taxType, taxValue]);

    const total = useMemo(() => totalBeforeTax + taxAmount, [totalBeforeTax, taxAmount]);

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setDiscountValue('');
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return;

        if (discountType === 'percentage' && numValue > 100) {
            setDiscountValue(100);
        } else {
            setDiscountValue(numValue);
        }
    };

    const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setTaxValue('');
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return;
        setTaxValue(numValue);
    };

    const handleSaveSale = async () => {
        if (cart.length === 0) {
            setToastMessage({ message: "The cart is empty.", type: 'error' });
            return;
        }
        if ((paymentStatus === 'credit' || paymentStatus === 'invoice') && !selectedCustomer) {
            setToastMessage({ message: "Please select a customer for credit or invoice sales.", type: 'error' });
            return;
        }
        if (paymentStatus === 'invoice' && !invoiceNumber.trim()) {
            setToastMessage({ message: "Please enter an invoice number for invoice sales.", type: 'error' });
            return;
        }
        if (!currentUser) {
            setToastMessage({ message: "Cannot save sale. No user is logged in.", type: 'error' });
            return;
        }

        const saleData: any = {
            items: cart.map(item => ({ ...item, quantity: Number(item.quantity) || 1 })),
            paymentMethod,
            paymentStatus,
            employeeId: currentUser.id,
        };
        if (paymentStatus === 'credit' || paymentStatus === 'invoice') {
            saleData.customerId = selectedCustomer;
        }
        if (paymentStatus === 'invoice') {
            saleData.invoiceDetails = { invoiceNumber: invoiceNumber.trim() };
        }
        const numDiscountValue = Number(discountValue) || 0;
        if (numDiscountValue > 0) {
            saleData.discount = {
                type: discountType,
                value: numDiscountValue
            };
        }
        const numTaxValue = Number(taxValue) || 0;
        if (numTaxValue > 0) {
            saleData.tax = {
                type: taxType,
                value: numTaxValue
            };
        }
        
        const newSale = await addSale(saleData);
        setSaleToPrint(newSale);
        setToastMessage({ message: `Sale #${newSale.receiptNumber} saved successfully.`, type: 'success' });
        
        // Reset state
        setCart([]);
        setPaymentMethod('cash');
        setPaymentStatus('paid');
        setSelectedCustomer('');
        setInvoiceNumber('');
        setDiscountType('fixed');
        setDiscountValue('');
        setTaxType('percentage');
        setTaxValue('');
    };

    const handlePrint = () => {
        try {
            window.print();
            // This code executes after the print dialog is closed (printed or cancelled)
            setSaleToPrint(null); // Close the modal
            setToastMessage({ message: 'Print command sent successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            // Do not close the modal, just show an error toast
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };
    
    const dailySalesHistory = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let filteredSales = sales.filter(sale => new Date(sale.date) >= todayStart);

        if (statusFilter !== 'all') {
            filteredSales = filteredSales.filter(sale => sale.paymentStatus === statusFilter);
        }

        return filteredSales;
    }, [sales, statusFilter]);

    return (
        <div className="space-y-6">
             {toastMessage && (
                <div 
                    className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white ${toastMessage.type === 'success' ? 'bg-secondary' : 'bg-red-600'}`}
                    role="alert"
                >
                    {toastMessage.message}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Card title="New Sale">
                        <div className="relative">
                            <Input 
                                placeholder="Search for a product..." 
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                            />
                            {filteredProducts.length > 0 && (
                                <ul className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 shadow-lg">
                                    {filteredProducts.map(p => (
                                        <li key={p.id} onClick={() => addToCart(p)} className="px-3 py-1.5 hover:bg-yellow-100 cursor-pointer text-sm">
                                            <div className="flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="text-text-secondary">${p.price.toFixed(2)} (Stock: {p.stock})</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="mt-6 border-t border-border">
                            {cart.length === 0 ? <p className="text-center text-text-secondary py-4">Your cart is empty.</p> :
                             cart.map(item => {
                                 const product = products.find(p => p.id === item.productId);
                                 if (!product) return null;
                                 const hasDiscount = item.discount && item.discount.value > 0;
                                 const quantityExceedsStock = Number(item.quantity) > product.stock;

                                 return (
                                    <div key={item.productId} className="grid grid-cols-[1fr_auto] items-center px-2 py-1 border-b border-border gap-4">
                                       <div className="min-w-0">
                                            <p className="font-semibold truncate" title={getProductName(item.productId)}>{getProductName(item.productId)}</p>
                                            <p className="text-sm text-text-secondary">${item.salePrice.toFixed(2)} (Stock: {product.stock})</p>
                                            {quantityExceedsStock && <p className="text-xs text-red-500">Not enough stock!</p>}
                                        </div>
                                       <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded-full text-gray-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                           <input
                                                type="number"
                                                className={`w-16 text-center font-semibold border rounded-md py-1 bg-white ${quantityExceedsStock ? 'border-red-500' : 'border-border'}`}
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                                onBlur={(e) => handleQuantityBlur(e, item.productId)}
                                                min="1"
                                                max={product.stock}
                                                aria-label={`Quantity for ${getProductName(item.productId)}`}
                                            />
                                           <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded-full text-gray-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={Number(item.quantity) >= product.stock}>
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                            <span className="w-20 text-right font-bold">${((Number(item.quantity) || 0) * item.salePrice).toFixed(2)}</span>
                                            <button type="button" onClick={() => setItemToDiscount(item)} className={`p-2 rounded-full hover:bg-yellow-100 ${hasDiscount ? 'text-secondary' : 'text-gray-500'}`} aria-label="Add item discount">
                                                <TagIcon className="w-5 h-5" />
                                            </button>
                                            <button type="button" onClick={() => removeFromCart(item.productId)} className="p-2 rounded-full text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" aria-label="Remove item">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                       </div>
                                    </div>
                                 );
                            })}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title="Payment Details">
                        <div className="space-y-4">
                            <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                                <option value="cash">Cash</option>
                                <option value="mobile">Mobile Payment</option>
                                <option value="card">Card</option>
                            </Select>
                            <Select label="Payment Status" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}>
                                <option value="paid">Paid</option>
                                <option value="credit">Credit</option>
                                <option value="invoice">Invoice</option>
                            </Select>
                            {(paymentStatus === 'credit' || paymentStatus === 'invoice') && (
                                <Select label="Customer" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                                    <option value="">Select Customer</option>
                                    {customers.filter(c => c.type === paymentStatus).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            )}
                            {paymentStatus === 'invoice' && (
                                <Input label="Invoice Number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                            )}
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <Select label="Order Discount" value={discountType} onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}>
                                        <option value="fixed">Fixed ($)</option>
                                        <option value="percentage">Percent (%)</option>
                                    </Select>
                                </div>
                                <div className="w-2/3">
                                    <Input 
                                        label="Value" 
                                        type="number" 
                                        value={discountValue} 
                                        onChange={handleDiscountChange}
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <Select label="Tax" value={taxType} onChange={e => setTaxType(e.target.value as 'percentage' | 'fixed')}>
                                        <option value="percentage">Percent (%)</option>
                                        <option value="fixed">Fixed ($)</option>
                                    </Select>
                                </div>
                                <div className="w-2/3">
                                    <Input 
                                        label="Value" 
                                        type="number" 
                                        value={taxValue} 
                                        onChange={handleTaxChange}
                                        placeholder="0.00" 
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border space-y-2 text-lg">
                                <div className="flex justify-between items-center text-text-secondary">
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {itemDiscountsTotal > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600">
                                        <span>Item Discounts:</span>
                                        <span>-${itemDiscountsTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                 {cartDiscountAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-600">
                                        <span>Order Discount:</span>
                                        <span>-${cartDiscountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Before Tax:</span>
                                    <span>${totalBeforeTax.toFixed(2)}</span>
                                </div>
                                {taxAmount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span>Tax:</span>
                                        <span>+${taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-2xl font-bold">
                                    <span>Total:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button 
                                size="lg" 
                                className="w-full" 
                                onClick={handleSaveSale} 
                                disabled={
                                    cart.length === 0 || 
                                    ((paymentStatus === 'credit' || paymentStatus === 'invoice') && !selectedCustomer) ||
                                    (paymentStatus === 'invoice' && !invoiceNumber.trim())
                                }
                            >
                                Save Sale
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
            <Card
                title="Today's Sales"
                action={
                    <div className="space-x-2">
                        {(['all', 'paid', 'credit', 'invoice'] as const).map(filter => (
                            <Button
                                key={filter}
                                size="sm"
                                variant={statusFilter === filter ? 'primary' : 'ghost'}
                                onClick={() => setStatusFilter(filter)}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                        ))}
                    </div>
                }
            >
                 <div className="max-h-[550px] overflow-y-auto">
                     <Table headers={[
                        { label: 'Receipt', className: 'w-48' },
                        { label: 'Date', className: 'w-32' },
                        { label: 'Customer', className: 'w-40' },
                        { label: 'Employee', className: 'w-40' },
                        { label: 'Products', className: 'w-auto' },
                        { label: 'Total', className: 'w-28 text-right' },
                        { label: 'Method', className: 'w-28' },
                        { label: 'Status', className: 'w-28' }
                     ]}>
                        {dailySalesHistory.map(sale => {
                            const receiptText = sale.paymentStatus === 'invoice' && sale.invoiceDetails?.invoiceNumber
                                ? `${sale.receiptNumber} / ${sale.invoiceDetails.invoiceNumber}`
                                : sale.receiptNumber;
                            const customerName = sale.customerId ? getCustomerName(sale.customerId) : 'N/A';
                            const employeeName = getEmployeeName(sale.employeeId);
                            return (
                                <tr key={sale.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => setSaleToPrint(sale)}>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary truncate" title={receiptText}>
                                        {receiptText}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(sale.date).toLocaleTimeString()}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={customerName}>{customerName}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={employeeName}>{employeeName}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary">
                                        <div className="space-y-1">
                                            {sale.items.map(item => (
                                                <div key={item.productId} className="flex justify-between items-center gap-2">
                                                    <span className="truncate min-w-0" title={getProductName(item.productId)}>
                                                        {getProductName(item.productId)}
                                                    </span>
                                                    <span className="flex-shrink-0 whitespace-nowrap">
                                                        {item.quantity} x @ ${item.salePrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-text-primary text-right">${sale.total.toFixed(2)}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary capitalize">{sale.paymentMethod}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base">
                                        <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                            sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                            sale.paymentStatus === 'credit' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {sale.paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
                </div>
            </Card>
             {saleToPrint && (
                <Modal 
                    isOpen={!!saleToPrint} 
                    onClose={() => setSaleToPrint(null)} 
                    title={`Receipt #${saleToPrint.receiptNumber}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrint}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setSaleToPrint(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintableReceipt sale={saleToPrint} getProductName={getProductName} getCustomerName={getCustomerName} getEmployeeName={getEmployeeName} receiptSettings={receiptSettings} />
                </Modal>
             )}
            {itemToDiscount && (
                <ItemDiscountModal
                    isOpen={!!itemToDiscount}
                    onClose={() => setItemToDiscount(null)}
                    item={itemToDiscount}
                    productName={getProductName(itemToDiscount.productId)}
                    onSave={handleSaveItemDiscount}
                />
            )}
        </div>
    );
};

export default Accounting;