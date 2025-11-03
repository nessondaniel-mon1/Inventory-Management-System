

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import { useInventory } from '../hooks/useInventory';
import type { Sale, ReceiptSettings, SaleItem, Payment, Bill, Customer } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { PrintableReceipt, PrintablePaymentReceipt, PrintableBillReceipt } from '../components/common/PrintableReceipts';

const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12"/><path d="M16 12h-4a2 2 0 0 0 0 4h4a2 2 0 0 0 0-4Z"/></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;


const Sales: React.FC = () => {
    const { sales, getEmployeeName, getCustomerName, getProductName, receiptSettings, payments, bills, customers, users: employees } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [saleToReview, setSaleToReview] = useState<Sale | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'credit' | 'invoice'>('all');
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'sales' | 'payments' | 'bills'>('sales');
    const [receiptDetails, setReceiptDetails] = useState<{ payment: Payment; customer: Customer } | null>(null);
    const [billForReceipt, setBillForReceipt] = useState<(Bill & { paidDate: Date; employeeId?: string; }) | null>(null);
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'credit' | 'invoice'>('all');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<'all' | string>('all');

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);
    
    const displayDate = useMemo(() => {
        const today = new Date();
        if (selectedDate.toDateString() === today.toDateString()) {
            return "Today";
        }
        return selectedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [selectedDate]);

    const totalSalesData = useMemo(() => {
        const relevantSales = sales
            .filter(s => new Date(s.date).toDateString() === selectedDate.toDateString())
            .filter(s => selectedEmployeeId === 'all' || s.employeeId === selectedEmployeeId);

        const total = relevantSales.reduce((sum, s) => sum + s.total, 0);
        const profit = relevantSales.reduce((sum, s) => sum + s.profit, 0);
        const margin = total > 0 ? (profit / total) * 100 : 0;
        
        const cashSales = relevantSales.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.total, 0);
        const creditSales = relevantSales.filter(s => s.paymentStatus === 'credit').reduce((sum, s) => sum + s.total, 0);
        const invoiceSales = relevantSales.filter(s => s.paymentStatus === 'invoice').reduce((sum, s) => sum + s.total, 0);

        return { total, profit, margin, cashSales, creditSales, invoiceSales };
    }, [sales, selectedDate, selectedEmployeeId]);

    const totalPaymentsData = useMemo(() => {
        const relevantPayments = payments
            .filter(p => p.type === 'inbound_customer')
            .filter(p => new Date(p.date).toDateString() === selectedDate.toDateString())
            .filter(p => selectedEmployeeId === 'all' || p.employeeId === selectedEmployeeId);
            
        const total = relevantPayments.reduce((sum, p) => sum + p.amount, 0);
        
        const invoice = relevantPayments
            .filter(p => p.description.startsWith('Payment for Invoice'))
            .reduce((sum, p) => sum + p.amount, 0);

        const credit = relevantPayments
            .filter(p => !p.description.startsWith('Payment for Invoice'))
            .reduce((sum, p) => sum + p.amount, 0);

        return { total, credit, invoice };
    }, [payments, selectedDate, selectedEmployeeId]);
    
    const totalBillsPaidData = useMemo(() => {
        const relevantPayments = payments
            .filter(p => p.type === 'outbound_bill')
            .filter(p => new Date(p.date).toDateString() === selectedDate.toDateString())
            .filter(p => selectedEmployeeId === 'all' || p.employeeId === selectedEmployeeId);
        
        const paidBillIds = new Set(relevantPayments.map(p => p.referenceId));
        
        const result = bills.reduce((acc, bill) => {
            if (paidBillIds.has(bill.id)) {
                if (bill.isRecurring) {
                    acc.recurring += bill.amount;
                } else {
                    acc.oneTime += bill.amount;
                }
            }
            return acc;
        }, { recurring: 0, oneTime: 0 });

        return {
            total: result.recurring + result.oneTime,
            recurring: result.recurring,
            oneTime: result.oneTime
        };
    }, [bills, payments, selectedDate, selectedEmployeeId]);

    const filteredSales = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        
        return sales.filter(sale => {
            // Text search logic
            let matchesText = true;
            if (searchTerm.trim() !== '') {
                const customerName = sale.customerId ? getCustomerName(sale.customerId) : 'N/A';
                matchesText = (
                    getEmployeeName(sale.employeeId).toLowerCase().includes(lowercasedSearchTerm) ||
                    customerName.toLowerCase().includes(lowercasedSearchTerm) ||
                    sale.receiptNumber.toLowerCase().includes(lowercasedSearchTerm)
                );
            }

            // Date search logic
            const matchesDate = new Date(sale.date).toDateString() === selectedDate.toDateString();

            // Status filter logic
            const matchesStatus = statusFilter === 'all' || sale.paymentStatus === statusFilter;

            // Employee filter
            const matchesEmployee = selectedEmployeeId === 'all' || sale.employeeId === selectedEmployeeId;

            return matchesText && matchesDate && matchesStatus && matchesEmployee;
        });
    }, [sales, searchTerm, getEmployeeName, getCustomerName, selectedDate, statusFilter, selectedEmployeeId]);
    
    const recentPayments = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        return payments.filter(p => {
            if (p.type === 'outbound_bill') return false; // Only show inbound payments
            
            // Text search
            let matchesText = true;
            if (searchTerm.trim() !== '') {
                const employeeName = getEmployeeName(p.employeeId).toLowerCase();
                const paymentId = p.id.toLowerCase();
                const customerName = getCustomerName(p.referenceId).toLowerCase();
                matchesText = employeeName.includes(lowercasedFilter) ||
                              paymentId.includes(lowercasedFilter) ||
                              customerName.includes(lowercasedFilter);
            }
            
            // Date search
            const matchesDate = new Date(p.date).toDateString() === selectedDate.toDateString();

            // Payment type filter
            const isInvoicePayment = p.description.startsWith('Payment for Invoice');
            const matchesPaymentType = paymentFilter === 'all' ||
                (paymentFilter === 'invoice' && isInvoicePayment) ||
                (paymentFilter === 'credit' && !isInvoicePayment);

            // Employee filter
            const matchesEmployee = selectedEmployeeId === 'all' || p.employeeId === selectedEmployeeId;

            return matchesText && matchesDate && matchesPaymentType && matchesEmployee;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments, searchTerm, getEmployeeName, getCustomerName, selectedDate, paymentFilter, selectedEmployeeId]);
    
    const paidBillsHistory = useMemo(() => {
        const paymentMap: Map<string, Payment> = new Map(payments.map(p => [p.referenceId, p]));
        const lowercasedFilter = searchTerm.toLowerCase();

        return bills
            .filter(b => b.status === 'paid')
            .map(bill => {
                const payment = paymentMap.get(bill.id);
                return {
                    ...bill,
                    paidDate: payment ? payment.date : bill.dueDate,
                    employeeId: payment?.employeeId,
                };
            })
            .filter(b => {
                 // Date Search
                const matchesDate = new Date(b.paidDate).toDateString() === selectedDate.toDateString();
                if (!matchesDate) return false;

                // Text Search
                if (searchTerm.trim() !== '') {
                    const employeeName = b.employeeId ? getEmployeeName(b.employeeId).toLowerCase() : '';
                    const vendor = b.vendor.toLowerCase();
                    const description = b.description.toLowerCase();
                    return employeeName.includes(lowercasedFilter) ||
                                  vendor.includes(lowercasedFilter) ||
                                  description.includes(lowercasedFilter);
                }
                
                // Employee filter
                const matchesEmployee = selectedEmployeeId === 'all' || b.employeeId === selectedEmployeeId;
                if (!matchesEmployee) return false;

                return true;
            })
            // FIX: In the `paidBillsHistory` memo, the sort function was comparing `b.paidDate` with `a.date`, but `a.date` does not exist on the mapped object. The correct property is `a.paidDate`.
            .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
            
    }, [bills, payments, searchTerm, getEmployeeName, selectedDate, selectedEmployeeId]);

    const handlePrintSaleReceipt = () => {
        try {
            window.print();
            setSaleToReview(null); 
            setToastMessage({ message: 'Print command sent successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };
    
    const openReceiptForPayment = (payment: Payment) => {
        if (payment.type !== 'inbound_customer') return;
        const customer = customers.find(c => c.id === payment.referenceId);
        if (customer) {
            setReceiptDetails({ payment, customer });
        } else {
            setToastMessage({ message: `Could not find customer details for payment ${payment.id}.`, type: 'error' });
        }
    };

    const handlePrintPaymentReceipt = () => {
        try {
            window.print();
            setReceiptDetails(null);
            setToastMessage({ message: 'Receipt printed successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };

    const handlePrintBillReceipt = () => {
        try {
            window.print();
            setBillForReceipt(null);
            setToastMessage({ message: 'Receipt printed successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };

    const searchPlaceholder = useMemo(() => {
        switch(activeTab) {
            case 'sales': return "Search by customer or receipt...";
            case 'payments': return "Search payments by customer or ID...";
            case 'bills': return "Search bills by vendor or description...";
            default: return "Search...";
        }
    }, [activeTab]);

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
            
             <div className="flex justify-end items-center gap-4">
                <Select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-auto bg-sidebar text-white border-slate-600"
                    style={{ colorScheme: 'dark' }}
                >
                    <option value="all">All Employees</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </Select>
                <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                        if (e.target.value) {
                            const newDate = new Date(e.target.value + 'T00:00:00');
                            setSelectedDate(newDate);
                        }
                    }}
                    className="w-auto bg-sidebar text-white border-slate-600"
                    style={{ colorScheme: 'dark' }}
                />
            </div>

            <Card title={`Sales Summary for ${displayDate}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    <div>
                        <p className="text-base text-text-secondary">Total Sales</p>
                        <p className="text-3xl font-bold text-primary">${totalSalesData.total.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-base text-text-secondary">Cash Sales</p>
                        <p className="text-2xl font-semibold text-secondary">${totalSalesData.cashSales.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-base text-text-secondary">Credit Sales</p>
                        <p className="text-2xl font-semibold text-yellow-600">${totalSalesData.creditSales.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-base text-text-secondary">Invoice Sales</p>
                        <p className="text-2xl font-semibold text-blue-600">${totalSalesData.invoiceSales.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border text-center">
                    <p className="text-lg">
                        Gross Profit: <span className="font-bold text-secondary">${totalSalesData.profit.toFixed(2)}</span>
                        <span className="text-text-secondary mx-2">|</span>
                        Profit Margin: <span className="font-bold text-secondary">{totalSalesData.margin.toFixed(1)}%</span>
                    </p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={`Payments Received on ${displayDate}`}>
                    <div className="flex items-center mb-2">
                        <WalletIcon className="w-8 h-8 text-secondary mr-4" />
                        <p className="text-3xl font-bold">${totalPaymentsData.total.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-base text-text-secondary">
                        <p>Credit Payments: <span className="font-semibold text-text-primary float-right">${totalPaymentsData.credit.toFixed(2)}</span></p>
                        <p>Invoice Payments: <span className="font-semibold text-text-primary float-right">${totalPaymentsData.invoice.toFixed(2)}</span></p>
                    </div>
                </Card>
                <Card title={`Bills Paid on ${displayDate}`}>
                     <div className="flex items-center mb-2">
                        <FileTextIcon className="w-8 h-8 text-red-500 mr-4" />
                        <p className="text-3xl font-bold">${totalBillsPaidData.total.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-base text-text-secondary">
                        <p>Recurring Bills: <span className="font-semibold text-text-primary float-right">${totalBillsPaidData.recurring.toFixed(2)}</span></p>
                        <p>One-time Bills: <span className="font-semibold text-text-primary float-right">${totalBillsPaidData.oneTime.toFixed(2)}</span></p>
                    </div>
                </Card>
            </div>

            <Card 
                title="Transaction History"
                action={
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            size="sm"
                            onClick={() => setActiveTab('sales')}
                            variant={activeTab === 'sales' ? 'primary' : 'ghost'}
                        >
                            Sales History
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setActiveTab('payments')}
                            variant={activeTab === 'payments' ? 'primary' : 'ghost'}
                        >
                            Recent Payments
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setActiveTab('bills')}
                            variant={activeTab === 'bills' ? 'primary' : 'ghost'}
                        >
                            Paid Bills
                        </Button>
                    </div>
                }
            >
                <div className="mb-4">
                    <Input 
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'sales' && (
                    <>
                        <div className="mb-4">
                            {(['all', 'paid', 'credit', 'invoice'] as const).map(filter => (
                                <Button
                                    key={filter}
                                    size="sm"
                                    variant={statusFilter === filter ? 'primary' : 'ghost'}
                                    onClick={() => setStatusFilter(filter)}
                                    className="mr-2"
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Button>
                            ))}
                        </div>
                        <div className="max-h-[550px] overflow-y-auto">
                            <Table headers={[
                                { label: 'Receipt', className: 'w-40' },
                                { label: 'Time', className: 'w-32' },
                                { label: 'Employee', className: 'w-36' },
                                { label: 'Customer', className: 'w-36' },
                                { label: 'Items', className: 'w-1/3' },
                                { label: 'Total', className: 'w-28 text-right' },
                                { label: 'Profit', className: 'w-28 text-right' },
                                { label: 'Status', className: 'w-28' }
                            ]}>
                                {filteredSales.map(sale => {
                                    const receiptText = sale.paymentStatus === 'invoice' && sale.invoiceDetails?.invoiceNumber
                                        ? `${sale.receiptNumber} / ${sale.invoiceDetails.invoiceNumber}`
                                        : sale.receiptNumber;
                                    const employeeName = getEmployeeName(sale.employeeId);
                                    const customerName = sale.customerId ? getCustomerName(sale.customerId) : 'N/A';

                                    return (
                                        <tr key={sale.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => setSaleToReview(sale)}>
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary truncate" title={receiptText}>
                                                {receiptText}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(sale.date).toLocaleTimeString()}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={employeeName}>
                                                {employeeName}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary truncate" title={customerName}>
                                                {customerName}
                                            </td>
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
                                            <td className={`px-6 py-2 whitespace-nowrap text-base font-semibold text-right ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${sale.profit.toFixed(2)}</td>
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
                             {filteredSales.length === 0 && <p className="text-center text-text-secondary py-8">No sales found for this day.</p>}
                        </div>
                    </>
                )}
                
                {activeTab === 'payments' && (
                     <>
                        <div className="mb-4">
                            {(['all', 'credit', 'invoice'] as const).map(filter => (
                                <Button
                                    key={filter}
                                    size="sm"
                                    variant={paymentFilter === filter ? 'primary' : 'ghost'}
                                    onClick={() => setPaymentFilter(filter)}
                                    className="mr-2"
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Button>
                            ))}
                        </div>
                        <div className="max-h-[550px] overflow-y-auto">
                            <Table headers={['Receipt No.', 'Time', 'Employee', 'Customer', 'Type', 'Amount', 'Balance']}>
                                {recentPayments.map(p => {
                                    const customerName = getCustomerName(p.referenceId);
                                    const type = p.description.startsWith('Payment for Invoice') ? 'Invoice' : 'Credit';
                                    return (
                                        <tr key={p.id} onClick={() => openReceiptForPayment(p)} className="cursor-pointer hover:bg-yellow-100">
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary">{p.id}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(p.date).toLocaleTimeString()}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{getEmployeeName(p.employeeId)}</td>
                                            <td className="px-6 py-2 text-base font-medium text-text-primary truncate" title={customerName}>{customerName}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base"><span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${type === 'Invoice' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{type}</span></td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-right text-green-600">${p.amount.toFixed(2)}</td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-right text-text-primary">${p.balanceAfterPayment?.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </Table>
                            {recentPayments.length === 0 && <p className="text-center text-text-secondary py-8">No payments found for this day.</p>}
                        </div>
                    </>
                )}

                {activeTab === 'bills' && (
                     <div className="max-h-[550px] overflow-y-auto">
                        <Table headers={['Time Paid', 'Employee', 'Vendor', 'Description', 'Category', 'Amount']}>
                            {paidBillsHistory.map(b => (
                                <tr key={b.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => setBillForReceipt(b)}>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(b.paidDate).toLocaleTimeString()}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{b.employeeId ? getEmployeeName(b.employeeId) : 'N/A'}</td>
                                    <td className="px-6 py-2 text-base font-medium text-text-primary max-w-sm truncate" title={b.vendor}>{b.vendor}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary max-w-md truncate" title={b.description}>{b.description}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{b.category}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-right text-text-primary">${b.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </Table>
                        {paidBillsHistory.length === 0 && <p className="text-center text-text-secondary py-8">No bills were paid on this day.</p>}
                    </div>
                )}
            </Card>

            {saleToReview && (
                <Modal 
                    isOpen={!!saleToReview} 
                    onClose={() => setSaleToReview(null)} 
                    title={`Receipt #${saleToReview.receiptNumber}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrintSaleReceipt}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setSaleToReview(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintableReceipt sale={saleToReview} getProductName={getProductName} getCustomerName={getCustomerName} getEmployeeName={getEmployeeName} receiptSettings={receiptSettings} />
                </Modal>
             )}
            
            {receiptDetails && (
                <Modal 
                    isOpen={!!receiptDetails} 
                    onClose={() => setReceiptDetails(null)} 
                    title={`Receipt #${receiptDetails.payment.id}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrintPaymentReceipt}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setReceiptDetails(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintablePaymentReceipt payment={receiptDetails.payment} customer={receiptDetails.customer} receiptSettings={receiptSettings} />
                </Modal>
            )}

            {billForReceipt && (
                <Modal
                    isOpen={!!billForReceipt}
                    onClose={() => setBillForReceipt(null)}
                    title={`Receipt for ${billForReceipt.vendor}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrintBillReceipt}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setBillForReceipt(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintableBillReceipt
                        bill={billForReceipt}
                        getEmployeeName={getEmployeeName}
                        receiptSettings={receiptSettings}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Sales;