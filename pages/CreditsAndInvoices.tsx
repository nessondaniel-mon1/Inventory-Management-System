

import React, { useState, useRef, KeyboardEvent, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { Customer, Sale, ReceiptSettings, SaleItem, Payment } from '../types';

type SortOrder = 'name-asc' | 'name-desc' | 'balance-high' | 'balance-low';
type HistoryItem = (Sale & { transactionType: 'sale' }) | (Payment & { transactionType: 'payment' });


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
            <p className="text-center text-[10px] mt-1">{receiptSettings.footerText || 'Thank you for your business!'}</p>
        </div>
    )
};


const CreditsAndInvoices: React.FC = () => {
    const { customers, addCustomer, sales, payments, getCustomerName, getProductName, getEmployeeName, receiptSettings } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'creditBalance'>>({ name: '', type: 'credit', phone: '', address: '' });
    const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
    const [phoneError, setPhoneError] = useState('');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    const [creditSearchTerm, setCreditSearchTerm] = useState('');
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
    
    const [creditSortOrder, setCreditSortOrder] = useState<SortOrder>('name-asc');
    const [invoiceSortOrder, setInvoiceSortOrder] = useState<SortOrder>('name-asc');

    // State for recent credits/invoices table
    const [searchDay, setSearchDay] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [dateSearchError, setDateSearchError] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'credit' | 'invoice'>('all');

    // State for receipt modal
    const [saleToReview, setSaleToReview] = useState<Sale | null>(null);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const creditCustomers = useMemo(() => {
        const filtered = customers
            .filter(c => c.type === 'credit')
            .filter(c => c.name.toLowerCase().includes(creditSearchTerm.toLowerCase()));
        
        return filtered.sort((a, b) => {
            switch (creditSortOrder) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'balance-high':
                    return b.creditBalance - a.creditBalance;
                case 'balance-low':
                    return a.creditBalance - b.creditBalance;
                default:
                    return 0;
            }
        });
    }, [customers, creditSearchTerm, creditSortOrder]);

    const invoiceCustomers = useMemo(() => {
        const filtered = customers
            .filter(c => c.type === 'invoice')
            .filter(c => c.name.toLowerCase().includes(invoiceSearchTerm.toLowerCase()));

        return filtered.sort((a, b) => {
            switch (invoiceSortOrder) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'balance-high':
                    return b.creditBalance - a.creditBalance;
                case 'balance-low':
                    return a.creditBalance - b.creditBalance;
                default:
                    return 0;
            }
        });
    }, [customers, invoiceSearchTerm, invoiceSortOrder]);
    
    const recentCreditsAndInvoices = useMemo(() => {
        let filtered = sales.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'invoice');

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.paymentStatus === statusFilter);
        }

        // Apply date filter
        const hasDateSearch = searchDay || searchMonth || searchYear;
        if (hasDateSearch) {
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.date);
                const day = String(saleDate.getDate());
                const month = String(saleDate.getMonth() + 1);
                const year = String(saleDate.getFullYear());
                const dayMatch = !searchDay || day.startsWith(searchDay);
                const monthMatch = !searchMonth || month.startsWith(searchMonth);
                const yearMatch = !searchYear || year.startsWith(searchYear);
                return dayMatch && monthMatch && yearMatch;
            });
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, statusFilter, searchDay, searchMonth, searchYear]);

    const customerHistory = useMemo((): HistoryItem[] => {
        if (!selectedCustomer) return [];
        
        const customerSales = sales
            .filter(sale => sale.customerId === selectedCustomer.id)
            .map(sale => ({ ...sale, transactionType: 'sale' as const }));
        
        const customerPayments = payments
            .filter(p => p.referenceId === selectedCustomer.id && p.type === 'inbound_customer')
            .map(payment => ({ ...payment, transactionType: 'payment' as const }));
            
        const combinedHistory = [...customerSales, ...customerPayments];
        
        return combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    }, [selectedCustomer, sales, payments]);

    const openHistoryModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsHistoryModalOpen(true);
    };

    const closeHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setTimeout(() => setSelectedCustomer(null), 300); // Delay to allow modal to fade out
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewCustomer({ name: '', type: 'credit', phone: '', address: '' });
        setFormErrors({});
        setPhoneError('');
    };

    const handleAddCustomer = () => {
        const errors: { name?: string; phone?: string; address?: string } = {};
        
        if (!newCustomer.name.trim()) errors.name = 'Customer Name is required.';
        if (!newCustomer.phone.trim()) errors.phone = 'Phone number is required.';
        else if (phoneError) errors.phone = phoneError;
        if (!newCustomer.address.trim()) errors.address = 'Address is required.';
        
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            addCustomer(newCustomer);
            closeModal();
        }
    };
    
     const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setNewCustomer({ ...newCustomer, phone: value });
        if (value && !/^[0-9-]+$/.test(value)) {
            setPhoneError('Phone number must contain only numbers and hyphens.');
        } else {
            setPhoneError('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextFieldRef: React.RefObject<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextFieldRef.current?.focus();
        }
    };

    const handleFinalKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
         if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomer();
        }
    };
    
    const handleDateSearchChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (/^\d*$/.test(value)) {
            setter(value);
            setDateSearchError('');
        } else {
            setDateSearchError('Please enter only numbers for the date.');
        }
    };
    
    const handlePrint = () => {
        try {
            window.print();
            // This code executes after the print dialog is closed (printed or cancelled)
            setSaleToReview(null); // Close the modal
            setToastMessage({ message: 'Print command sent successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            // Do not close the modal, just show an error toast
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Credit Customers" action={
                    <div className="flex items-center gap-4">
                        <Select value={creditSortOrder} onChange={e => setCreditSortOrder(e.target.value as SortOrder)}>
                            <option value="name-asc">Sort: Name (A-Z)</option>
                            <option value="name-desc">Sort: Name (Z-A)</option>
                            <option value="balance-high">Sort: Balance (High)</option>
                            <option value="balance-low">Sort: Balance (Low)</option>
                        </Select>
                        <Button onClick={() => setIsModalOpen(true)}>Add Customer</Button>
                    </div>
                }>
                    <div className="mb-4">
                        <Input
                            placeholder="Search credit customers..."
                            value={creditSearchTerm}
                            onChange={e => setCreditSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[450px] overflow-y-auto">
                        <Table headers={['Name', 'Phone', 'Address', 'Credit Balance']}>
                            {creditCustomers.map(c => (
                                <tr key={c.id} onClick={() => openHistoryModal(c)} className="cursor-pointer hover:bg-yellow-100">
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-text-primary truncate max-w-xs" title={c.name}>{c.name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{c.phone}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate max-w-xs" title={c.address}>{c.address}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-red-600">${c.creditBalance.toFixed(2)}</td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </Card>

                <Card title="Invoice Customers" action={
                     <Select value={invoiceSortOrder} onChange={e => setInvoiceSortOrder(e.target.value as SortOrder)}>
                        <option value="name-asc">Sort: Name (A-Z)</option>
                        <option value="name-desc">Sort: Name (Z-A)</option>
                        <option value="balance-high">Sort: Balance (High)</option>
                        <option value="balance-low">Sort: Balance (Low)</option>
                    </Select>
                }>
                     <div className="mb-4">
                        <Input
                            placeholder="Search invoice customers..."
                            value={invoiceSearchTerm}
                            onChange={e => setInvoiceSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[450px] overflow-y-auto">
                        <Table headers={['Name', 'Phone', 'Address', 'Balance']}>
                            {invoiceCustomers.map(c => (
                                <tr key={c.id} onClick={() => openHistoryModal(c)} className="cursor-pointer hover:bg-yellow-100">
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-text-primary truncate max-w-xs" title={c.name}>{c.name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{c.phone}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate max-w-xs" title={c.address}>{c.address}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-blue-600">${c.creditBalance.toFixed(2)}</td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </Card>
            </div>

            <Card
                title="Recent Credits & Invoices"
                action={
                    <div className="space-x-2">
                        {(['all', 'credit', 'invoice'] as const).map(filter => (
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
                <div className="mb-4">
                    <div className="flex items-center gap-4">
                        <p className="font-medium text-text-secondary flex-shrink-0">Search by date:</p>
                        <div className="grid grid-cols-3 gap-2">
                             <Input
                                placeholder="DD"
                                value={searchDay}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchDay)}
                                maxLength={2}
                                className="w-[60px] bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="MM"
                                value={searchMonth}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchMonth)}
                                maxLength={2}
                                className="w-[60px] bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="YYYY"
                                value={searchYear}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchYear)}
                                maxLength={4}
                                className="w-24 bg-gray-100 text-black border-primary"
                            />
                        </div>
                    </div>
                     {dateSearchError && <p className="text-red-500 text-sm mt-2">{dateSearchError}</p>}
                </div>
                <div className="max-h-[550px] overflow-y-auto">
                    <Table headers={[
                        { label: 'Receipt', className: 'w-[200px]' },
                        { label: 'Date', className: 'w-[180px]' },
                        { label: 'Employee', className: 'w-[150px]' },
                        { label: 'Customer', className: 'w-[150px]' },
                        'Items',
                        { label: 'Total', className: 'w-[100px]' },
                        { label: 'Status', className: 'w-[80px]' }
                    ]}>
                        {recentCreditsAndInvoices.map(s => (
                            <tr key={s.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => setSaleToReview(s)}>
                                <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary">
                                    {s.paymentStatus === 'invoice' && s.invoiceDetails?.invoiceNumber
                                        ? `${s.receiptNumber} / ${s.invoiceDetails.invoiceNumber}`
                                        : s.receiptNumber}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(s.date).toLocaleString()}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={getEmployeeName(s.employeeId)}>{getEmployeeName(s.employeeId)}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={s.customerId ? getCustomerName(s.customerId) : 'N/A'}>{s.customerId ? getCustomerName(s.customerId) : 'N/A'}</td>
                                <td className="px-6 py-2 text-base text-text-secondary">
                                    <div className="space-y-1">
                                        {s.items.map(item => (
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
                                <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-text-primary">${s.total.toFixed(2)}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base">
                                    <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                        s.paymentStatus === 'credit' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {s.paymentStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Customer" footer={
                <>
                    <Button onClick={handleAddCustomer}>Add Customer</Button>
                    <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                </>
            }>
                <div className="space-y-4">
                    <Input 
                        ref={nameInputRef}
                        label="Customer Name" 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                        onKeyDown={e => handleKeyDown(e, phoneInputRef)}
                        error={formErrors.name}
                    />
                    <Input 
                        ref={phoneInputRef}
                        label="Phone" 
                        value={newCustomer.phone} 
                        onChange={handlePhoneChange}
                        onKeyDown={e => handleKeyDown(e, addressInputRef)}
                        error={formErrors.phone || phoneError}
                    />
                    <Input 
                        ref={addressInputRef}
                        label="Address" 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                        onKeyDown={handleFinalKeyDown}
                        error={formErrors.address}
                    />
                    <Select label="Customer Type" value={newCustomer.type} onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value as 'credit' | 'invoice' })}>
                        <option value="credit">Credit</option>
                        <option value="invoice">Invoice</option>
                    </Select>
                </div>
            </Modal>

            <Modal
                isOpen={isHistoryModalOpen}
                onClose={closeHistoryModal}
                title={`History for ${selectedCustomer?.name}`}
                size="5xl"
                footer={<Button variant="ghost" onClick={closeHistoryModal}>Close</Button>}
            >
                {selectedCustomer && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-3 gap-4">
                             <div><span className="font-semibold">Phone:</span> {selectedCustomer.phone}</div>
                             <div><span className="font-semibold">Address:</span> {selectedCustomer.address}</div>
                             {selectedCustomer.creditBalance > 0 && (
                                <div className="text-lg font-bold">
                                    Current Balance: <span className={selectedCustomer.type === 'credit' ? "text-red-600" : "text-blue-600"}>${selectedCustomer.creditBalance.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                             <table className="min-w-full divide-y divide-border">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-2 text-left text-sm font-medium text-text-secondary uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-2 text-left text-sm font-medium text-text-secondary uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-2 text-left text-sm font-medium text-text-secondary uppercase tracking-wider">Reference / Details</th>
                                        <th scope="col" className="px-6 py-2 text-left text-sm font-medium text-text-secondary uppercase tracking-wider">Employee</th>
                                        <th scope="col" className="px-6 py-2 text-right text-sm font-medium text-text-secondary uppercase tracking-wider">Debit</th>
                                        <th scope="col" className="px-6 py-2 text-right text-sm font-medium text-text-secondary uppercase tracking-wider">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {customerHistory.length > 0 ? customerHistory.map(item => {
                                        const isSale = item.transactionType === 'sale';
                                        const key = isSale ? `sale-${item.id}` : `payment-${item.id}`;
                                        const employeeName = getEmployeeName(isSale ? (item as Sale).employeeId : (item as Payment).employeeId);

                                        return (
                                            <tr key={key}>
                                                <td className="px-6 py-2 align-top whitespace-nowrap text-base text-text-secondary">{new Date(item.date).toLocaleString()}</td>
                                                <td className="px-6 py-2 align-top whitespace-nowrap text-base">
                                                    {isSale ? (
                                                        <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Sale</span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">Payment</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-2 align-top text-base text-text-secondary">
                                                    {isSale ? (
                                                        <div>
                                                            <p className="font-medium text-primary">
                                                                {(item as Sale).receiptNumber}
                                                                {(item as Sale).invoiceDetails?.invoiceNumber && (
                                                                    <span className="text-blue-600"> / {(item as Sale).invoiceDetails.invoiceNumber}</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-text-secondary">{`${(item as Sale).items.length} item(s)`}</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="font-medium text-primary">{item.id}</p>
                                                            <p className="text-xs text-text-secondary truncate" title={(item as Payment).description}>{(item as Payment).description}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-2 align-top whitespace-nowrap text-base text-text-secondary">{employeeName}</td>
                                                <td className="px-6 py-2 align-top whitespace-nowrap text-base font-semibold text-right text-red-600">
                                                    {isSale ? `$${(item as Sale).total.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-2 align-top whitespace-nowrap text-base font-semibold text-right text-green-600">
                                                    {isSale ? '-' : `$${(item as Payment).amount.toFixed(2)}`}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={6}>
                                                <p className="text-center text-text-secondary py-8">No transaction history found for this customer.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
            
            {saleToReview && (
                <Modal 
                    isOpen={!!saleToReview} 
                    onClose={() => setSaleToReview(null)} 
                    title={`Receipt #${saleToReview.receiptNumber}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrint}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setSaleToReview(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintableReceipt 
                        sale={saleToReview} 
                        getProductName={getProductName} 
                        getCustomerName={getCustomerName} 
                        getEmployeeName={getEmployeeName} 
                        receiptSettings={receiptSettings} 
                    />
                </Modal>
             )}
        </div>
    );
};

export default CreditsAndInvoices;