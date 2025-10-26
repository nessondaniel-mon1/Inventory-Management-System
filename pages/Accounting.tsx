import React, { useState, useMemo, useRef } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { SaleItem, Product, PaymentMethod, PaymentStatus, Sale } from '../types';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

interface PrintableReceiptProps {
    sale: Sale;
    getProductName: (id: string) => string;
    getCustomerName: (id: string) => string;
    getEmployeeName: (id: string) => string;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, getProductName, getCustomerName, getEmployeeName }) => (
    <div className="printable-receipt p-4 font-mono text-sm text-black bg-white">
        <div className="text-center">
            <h2 className="text-xl font-bold">INVENTORY PRO</h2>
            <p>123 Business Rd, Commerce City, 12345</p>
            <p>Tel: (123) 456-7890</p>
            <hr className="my-2 border-dashed border-black" />
        </div>
        <div className="flex justify-between">
            <p>Receipt #: {sale.receiptNumber}</p>
            <p>Date: {new Date(sale.date).toLocaleString()}</p>
        </div>
        <div className="flex justify-between">
            <p>Cashier: {getEmployeeName(sale.employeeId)}</p>
            <p>Customer: {sale.customerId ? getCustomerName(sale.customerId) : 'Walk-in'}</p>
        </div>
        <hr className="my-2 border-dashed border-black" />
        <table className="w-full">
            <thead>
                <tr>
                    <th className="text-left">ITEM</th>
                    <th className="text-center">QTY</th>
                    <th className="text-right">PRICE</th>
                    <th className="text-right">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map(item => (
                    <tr key={item.productId}>
                        <td>{getProductName(item.productId)}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">${item.unitCost.toFixed(2)}</td>
                        <td className="text-right">${(item.quantity * item.unitCost).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <hr className="my-2 border-dashed border-black" />
        <div className="text-right">
            <p><span className="font-semibold">Subtotal:</span> ${sale.total.toFixed(2)}</p>
            <p><span className="font-semibold">Tax (0%):</span> $0.00</p>
            <p className="text-lg font-bold"><span className="font-semibold">TOTAL:</span> ${sale.total.toFixed(2)}</p>
        </div>
        <hr className="my-2 border-dashed border-black" />
        <p className="text-center">Thank you for your business!</p>
    </div>
);

const Accounting: React.FC = () => {
    const { products, customers, addSale, getProductName, sales, getCustomerName, getEmployeeName } = useInventory();
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5);
    }, [products, productSearch]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.productId === product.id);
            if (existingItem) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { productId: product.id, quantity: 1, unitCost: product.price }];
        });
        setProductSearch('');
    };

    const updateQuantity = (productId: string, change: number) => {
        setCart(prev => {
            const updatedCart = prev.map(item => {
                if (item.productId === productId) {
                    return { ...item, quantity: Math.max(1, item.quantity + change) };
                }
                return item;
            });
            return updatedCart;
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitCost, 0), [cart]);
    
    const handleSaveSale = () => {
        if (cart.length === 0) return;
        
        const saleData: any = {
            items: cart,
            paymentMethod,
            paymentStatus,
        };
        if (paymentStatus === 'credit' || paymentStatus === 'invoice') {
            saleData.customerId = selectedCustomer;
        }
        if (paymentStatus === 'invoice') {
            saleData.invoiceDetails = { invoiceNumber };
        }
        
        const newSale = addSale(saleData);
        setSaleToPrint(newSale);
        
        // Reset state
        setCart([]);
        setPaymentMethod('cash');
        setPaymentStatus('paid');
        setSelectedCustomer('');
        setInvoiceNumber('');
    };
    
    const recentSales = sales.slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
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
                                        <li key={p.id} onClick={() => addToCart(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                            {p.name} - ${p.price.toFixed(2)} (In Stock: {p.stock})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="mt-6 space-y-4">
                            {cart.length === 0 ? <p className="text-center text-text-secondary">Your cart is empty.</p> :
                             cart.map(item => (
                                <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                   <div>
                                       <p className="font-semibold">{getProductName(item.productId)}</p>
                                       <p className="text-sm text-text-secondary">${item.unitCost.toFixed(2)}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, -1)}><MinusIcon className="w-4 h-4" /></Button>
                                       <span className="w-10 text-center font-semibold">{item.quantity}</span>
                                       <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, 1)}><PlusIcon className="w-4 h-4" /></Button>
                                        <span className="w-20 text-right font-bold">${(item.quantity * item.unitCost).toFixed(2)}</span>
                                       <Button size="sm" variant="danger" onClick={() => removeFromCart(item.productId)}><TrashIcon className="w-4 h-4" /></Button>
                                   </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div>
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
                            <div className="pt-4 border-t border-border">
                                <div className="flex justify-between items-center text-2xl font-bold">
                                    <span>Total:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button size="lg" className="w-full" onClick={handleSaveSale} disabled={cart.length === 0 || ((paymentStatus === 'credit' || paymentStatus === 'invoice') && !selectedCustomer)}>
                                Save Sale
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
            <Card title="Recent Sales">
                 <Table headers={['Receipt', 'Date', 'Customer', 'Total']}>
                    {recentSales.map(sale => (
                        <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{sale.receiptNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(sale.date).toLocaleTimeString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{sale.customerId ? getCustomerName(sale.customerId) : 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">${sale.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </Table>
            </Card>
             {saleToPrint && (
                <Modal 
                    isOpen={!!saleToPrint} 
                    onClose={() => setSaleToPrint(null)} 
                    title={`Receipt #${saleToPrint.receiptNumber}`}
                    footer={
                        <>
                            <Button onClick={() => window.print()}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setSaleToPrint(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintableReceipt sale={saleToPrint} getProductName={getProductName} getCustomerName={getCustomerName} getEmployeeName={getEmployeeName} />
                </Modal>
             )}
        </div>
    );
};

export default Accounting;