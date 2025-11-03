import React, { useState, useMemo, useEffect, useRef, KeyboardEvent } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { Customer, Bill, Payment, ReceiptSettings, Sale } from '../types';
import { PrintablePaymentReceipt, PrintableBillReceipt } from '../components/common/PrintableReceipts';

// FIX: The `title` prop was causing a TypeScript error because it is not a standard property in React's SVG type definitions. The component has been updated to accept a `title` prop and render it as an accessible <title> element inside the SVG, which also provides a tooltip on hover.
const RepeatIcon = ({ title, ...props }: React.SVGProps<SVGSVGElement> & { title?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {title && <title>{title}</title>}
        <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </svg>
);


type NewBillState = Omit<Bill, 'id' | 'status' | 'amount'> & {
    amount: number | string;
};

const Payments: React.FC = () => {
    // FIX: The context provides `users`, which is aliased to `employees` here for use within the component.
    const { users: employees, customers, bills, payments, sales, receivePayment, receiveInvoicePayment, payBill, addBill, getEmployeeName, getCustomerName, receiptSettings } = useInventory();

    // State for Receive Payment Modal (Credit)
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [paymentError, setPaymentError] = useState('');
    const [receivingEmployeeId, setReceivingEmployeeId] = useState('');

    // State for Receive Payment Modal (Invoice)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

    // State for Pay Bill Modal
    const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [payingEmployeeId, setPayingEmployeeId] = useState('');
    
    // State for Add Bill Modal
    const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
    const [newBill, setNewBill] = useState<NewBillState>({ vendor: '', description: '', amount: '', dueDate: new Date(), category: 'Other', isRecurring: false });
    const [billFormErrors, setBillFormErrors] = useState<{ vendor?: string; description?: string; amount?: string, dueDate?: string }>({});

    // State for Bill Details Modal
    const [billForDetails, setBillForDetails] = useState<Bill | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    // State for Bill Receipt Modal
    const [billForReceipt, setBillForReceipt] = useState<(Bill & { paidDate: Date; employeeId?: string; }) | null>(null);

    // Refs for keyboard navigation in Add Bill modal
    const vendorInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);
    const dueDateInputRef = useRef<HTMLInputElement>(null);
    const categorySelectRef = useRef<HTMLSelectElement>(null);
    const recurringFreqRef = useRef<HTMLInputElement>(null);
    const recurringPeriodRef = useRef<HTMLSelectElement>(null);

    // State for Payment Receipt Modal
    const [receiptDetails, setReceiptDetails] = useState<{ payment: Payment; customer: Customer } | null>(null);

    // State for toast notifications
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // State for filtering bills
    const [billFilter, setBillFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('unpaid');
    
    // State for history view
    const [activeHistoryView, setActiveHistoryView] = useState<'payments' | 'paidBills'>('payments');
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [searchDay, setSearchDay] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [dateSearchError, setDateSearchError] = useState('');
    const [activeReceiveTab, setActiveReceiveTab] = useState<'invoices' | 'credit'>('invoices');
    const [paymentTransactionFilter, setPaymentTransactionFilter] = useState<'all' | 'invoice' | 'credit'>('all');


    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const customersWithCreditBalance = useMemo(() => {
        return customers.filter(c => c.type === 'credit' && c.creditBalance > 0).sort((a,b) => b.creditBalance - a.creditBalance);
    }, [customers]);

    const unpaidInvoices = useMemo(() => {
        return sales.filter(s => s.paymentStatus === 'invoice').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [sales]);
    
    const sortedBills = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to start of today for accurate overdue check

        const filtered = bills.filter(b => {
            if (billFilter === 'all') return true;
            if (billFilter === 'paid' || billFilter === 'unpaid') return b.status === billFilter;
            if (billFilter === 'overdue') return b.status === 'unpaid' && new Date(b.dueDate) < now;
            return true;
        });

        return [...filtered].sort((a,b) => {
             if (a.status === b.status) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
             }
             return a.status === 'unpaid' ? -1 : 1;
        });
    }, [bills, billFilter]);

    const recentPayments = useMemo(() => {
        const sorted = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(b.date).getTime());
        const lowercasedFilter = historySearchTerm.toLowerCase();
        const hasTextSearch = historySearchTerm.trim() !== '';
        const hasDateSearch = searchDay || searchMonth || searchYear;

        return sorted.filter(p => {
            // Text search
            let matchesText = true;
            if (hasTextSearch) {
                const employeeName = getEmployeeName(p.employeeId).toLowerCase();
                const paymentId = p.id.toLowerCase();
                let customerOrVendorName = '';
                if (p.type === 'outbound_bill') {
                    customerOrVendorName = p.description.replace('Paid bill to ', '').toLowerCase();
                } else {
                    customerOrVendorName = getCustomerName(p.referenceId).toLowerCase();
                }
                matchesText = employeeName.includes(lowercasedFilter) ||
                              paymentId.includes(lowercasedFilter) ||
                              customerOrVendorName.includes(lowercasedFilter);
            }

            // Date search
            let matchesDate = true;
            if (hasDateSearch) {
                const paymentDate = new Date(p.date);
                const day = String(paymentDate.getDate());
                const month = String(paymentDate.getMonth() + 1);
                const year = String(paymentDate.getFullYear());
                const dayMatch = !searchDay || day.startsWith(searchDay);
                const monthMatch = !searchMonth || month.startsWith(searchMonth);
                const yearMatch = !searchYear || year.startsWith(searchYear);
                matchesDate = dayMatch && monthMatch && yearMatch;
            }

            // Payment type filter
            let matchesPaymentType = true;
            if (paymentTransactionFilter !== 'all') {
                if (p.type === 'inbound_customer') {
                    const isInvoicePayment = p.description.startsWith('Payment for Invoice');
                    if (paymentTransactionFilter === 'invoice') {
                        matchesPaymentType = isInvoicePayment;
                    } else if (paymentTransactionFilter === 'credit') {
                        matchesPaymentType = !isInvoicePayment;
                    }
                } else {
                    // Not an inbound_customer payment, so it can't match 'invoice' or 'credit'
                    matchesPaymentType = false;
                }
            }

            return matchesText && matchesDate && matchesPaymentType;
        });
    }, [payments, historySearchTerm, getEmployeeName, getCustomerName, searchDay, searchMonth, searchYear, paymentTransactionFilter]);

    const paidBillsHistory = useMemo(() => {
        const paid = bills.filter(b => b.status === 'paid');
        const paymentMap: Map<string, Payment> = new Map(payments.map(p => [p.referenceId, p]));

        const history = paid.map(bill => {
            const payment = paymentMap.get(bill.id);
            return {
                ...bill,
                paidDate: payment ? payment.date : bill.dueDate,
                employeeId: payment?.employeeId,
            };
        }).sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

        const lowercasedFilter = historySearchTerm.toLowerCase();
        const hasTextSearch = historySearchTerm.trim() !== '';
        const hasDateSearch = searchDay || searchMonth || searchYear;

        return history.filter(b => {
            // Text Search
            let matchesText = true;
            if (hasTextSearch) {
                const employeeName = b.employeeId ? getEmployeeName(b.employeeId).toLowerCase() : '';
                const vendor = b.vendor.toLowerCase();
                const description = b.description.toLowerCase();
                matchesText = employeeName.includes(lowercasedFilter) ||
                              vendor.includes(lowercasedFilter) ||
                              description.includes(lowercasedFilter);
            }

            // Date Search
            let matchesDate = true;
            if (hasDateSearch) {
                const paidDate = new Date(b.paidDate);
                const day = String(paidDate.getDate());
                const month = String(paidDate.getMonth() + 1);
                const year = String(paidDate.getFullYear());
                const dayMatch = !searchDay || day.startsWith(day);
                const monthMatch = !searchMonth || month.startsWith(month);
                const yearMatch = !searchYear || year.startsWith(year);
                matchesDate = dayMatch && monthMatch && yearMatch;
            }

            return matchesText && matchesDate;
        });
    }, [bills, payments, historySearchTerm, getEmployeeName, searchDay, searchMonth, searchYear]);
    
    const customerTypeMap = useMemo(() => new Map(customers.map(c => [c.id, c.type])), [customers]);

    // --- Receive Payment Logic ---
    const openReceiveModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setPaymentAmount(customer.creditBalance.toFixed(2));
        setReceivingEmployeeId(employees[0]?.id || '');
        setIsReceiveModalOpen(true);
    };
    const closeReceiveModal = () => {
        setIsReceiveModalOpen(false);
        setSelectedCustomer(null);
        setPaymentAmount('');
        setPaymentError('');
        setReceivingEmployeeId('');
    };
    const handleReceivePayment = async () => {
        const amount = Number(paymentAmount);
        if (!selectedCustomer || !receivingEmployeeId || isNaN(amount) || amount <= 0 || amount > selectedCustomer.creditBalance) {
            setPaymentError(`Please enter a valid amount up to $${selectedCustomer?.creditBalance.toFixed(2)}.`);
            return;
        }
        const newPayment = await receivePayment(selectedCustomer.id, amount, receivingEmployeeId);
        const originalCustomerState = customers.find(c => c.id === selectedCustomer.id);
        setToastMessage({ message: `Payment of $${amount.toFixed(2)} received from ${selectedCustomer.name}.`, type: 'success' });
        if (originalCustomerState) {
            setReceiptDetails({ payment: newPayment, customer: originalCustomerState });
        }
        closeReceiveModal();
    };

    const handlePrintReceipt = () => {
        try {
            window.print();
            // This code executes after the print dialog is closed (printed or cancelled)
            setReceiptDetails(null); // Close the modal
            setToastMessage({ message: 'Receipt printed successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            // Do not close the modal, just show an error toast
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

    const openInvoiceModal = (invoice: Sale) => {
        setSelectedInvoice(invoice);
        setPaymentAmount(invoice.total.toFixed(2));
        setReceivingEmployeeId(employees[0]?.id || '');
        setIsInvoiceModalOpen(true);
    };
    
    const closeInvoiceModal = () => {
        setIsInvoiceModalOpen(false);
        setSelectedInvoice(null);
        setPaymentAmount('');
        setPaymentError('');
        setReceivingEmployeeId('');
    };
    
    const handleReceiveInvoicePayment = async () => {
        const amount = Number(paymentAmount);
        if (!selectedInvoice || !receivingEmployeeId || isNaN(amount) || amount <= 0 || amount > selectedInvoice.total) {
            setPaymentError(`Please enter a valid amount up to $${selectedInvoice?.total.toFixed(2)}.`);
            return;
        }
        const newPayment = await receiveInvoicePayment(selectedInvoice.id, amount, receivingEmployeeId);
        const originalCustomerState = customers.find(c => c.id === selectedInvoice.customerId);
        setToastMessage({ message: `Payment of $${amount.toFixed(2)} for invoice #${selectedInvoice.invoiceDetails?.invoiceNumber} received.`, type: 'success' });
        if(originalCustomerState){
            setReceiptDetails({ payment: newPayment, customer: originalCustomerState });
        }
        closeInvoiceModal();
    };

    // --- Reprint Receipt Logic ---
    const openReceiptForPayment = (payment: Payment) => {
        if (payment.type !== 'inbound_customer') return;
        const customer = customers.find(c => c.id === payment.referenceId);
        if (customer) {
            setReceiptDetails({ payment, customer });
        } else {
            setToastMessage({ message: `Could not find customer details for payment ${payment.id}.`, type: 'error' });
        }
    };

    // --- Pay Bill Logic ---
    const openPayBillModal = (bill: Bill) => {
        setSelectedBill(bill);
        setPayingEmployeeId(employees[0]?.id || '');
        setIsPayBillModalOpen(true);
    };
    const closePayBillModal = () => {
        setIsPayBillModalOpen(false);
        setSelectedBill(null);
        setPayingEmployeeId('');
    };
    const handlePayBill = () => {
        if (!selectedBill || !payingEmployeeId) return;
        payBill(selectedBill.id, payingEmployeeId);
        setToastMessage({ message: `Bill for $${selectedBill.amount.toFixed(2)} to ${selectedBill.vendor} paid.`, type: 'success' });
        closePayBillModal();
    };
    
    // --- Bill Details Logic ---
    const openDetailsModal = (bill: Bill) => {
        setBillForDetails(bill);
        setIsDetailsModalOpen(true);
    };
    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setBillForDetails(null);
    };

    // --- Add Bill/Expense Logic ---
    const billCategories: Bill['category'][] = ['Utilities', 'Rent', 'Services', 'Supplies', 'Other'];
    const closeAddBillModal = () => {
        setIsAddBillModalOpen(false);
        setNewBill({ vendor: '', description: '', amount: '', dueDate: new Date(), category: 'Other', isRecurring: false });
        setBillFormErrors({});
    };
    
    const handleAddBill = () => {
        const errors: { vendor?: string; description?: string; amount?: string, dueDate?: string } = {};
        if (!newBill.vendor.trim()) errors.vendor = "Vendor is required.";
        if (!newBill.description.trim()) errors.description = "Description is required.";
        
        const amount = Number(newBill.amount);
        if (isNaN(amount) || amount <= 0) {
             errors.amount = "Amount must be a valid number greater than zero.";
        }
        
        if (!newBill.dueDate) errors.dueDate = "Due date is required.";

        setBillFormErrors(errors);
        if (Object.keys(errors).length === 0) {
            addBill({ ...newBill, amount });
            setToastMessage({ message: `New bill for ${newBill.vendor} added.`, type: 'success' });
            closeAddBillModal();
        }
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setNewBill(prev => ({ ...prev, amount: value }));
            if (billFormErrors.amount) {
                setBillFormErrors(prev => ({ ...prev, amount: undefined }));
            }
        } else {
            setBillFormErrors(prev => ({ ...prev, amount: "Please enter only numbers." }));
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextFieldRef?: React.RefObject<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldRef?.current) {
                nextFieldRef.current.focus();
            } else {
                handleAddBill();
            }
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


    const getBillRowClass = (bill: Bill) => {
        if (bill.status === 'paid') return 'bg-white hover:bg-yellow-100';
    
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
    
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
        if (diffDays < 0) {
            return 'bg-red-50 hover:bg-red-100'; // Overdue
        }
        if (diffDays <= 7) {
            return 'bg-yellow-50 hover:bg-yellow-100'; // Due soon
        }
        return 'bg-white hover:bg-yellow-100'; // Default
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
                <Card 
                    title="Receive Customer Payments"
                    action={
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant={activeReceiveTab === 'invoices' ? 'primary' : 'ghost'} onClick={() => setActiveReceiveTab('invoices')}>
                                Invoices
                            </Button>
                            <Button size="sm" variant={activeReceiveTab === 'credit' ? 'primary' : 'ghost'} onClick={() => setActiveReceiveTab('credit')}>
                                Credit Accounts
                            </Button>
                        </div>
                    }
                >
                    <div className="max-h-[500px] overflow-y-auto">
                        {activeReceiveTab === 'invoices' ? (
                            <>
                                <Table headers={[{label: 'Invoice #'}, {label: 'Customer'}, {label: 'Amount'}, {label: 'Action', className: 'text-right w-48'}]}>
                                    {unpaidInvoices.map(invoice => (
                                        <tr key={invoice.id} className="hover:bg-yellow-100">
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary">
                                                {invoice.invoiceDetails?.invoiceNumber || invoice.receiptNumber}
                                            </td>
                                            <td className="px-6 py-2 text-base font-medium text-text-primary truncate max-w-xs" title={getCustomerName(invoice.customerId || '')}>
                                                {getCustomerName(invoice.customerId || '')}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-blue-600">
                                                ${invoice.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-right">
                                                <Button size="sm" onClick={() => openInvoiceModal(invoice)}>Record Payment</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                                {unpaidInvoices.length === 0 && <p className="text-center py-8 text-text-secondary">No outstanding invoices.</p>}
                            </>
                        ) : (
                             <>
                                <Table headers={[{label: 'Customer'}, { label: 'Balance', className: 'w-32' }, { label: 'Action', className: 'text-right w-48' }]}>
                                    {customersWithCreditBalance.map(c => (
                                        <tr key={c.id} className="hover:bg-yellow-100">
                                            <td className="px-6 py-2 text-base font-medium text-text-primary truncate max-w-xs" title={c.name}>{c.name}</td>
                                            <td className={`px-6 py-2 whitespace-nowrap text-base font-semibold text-red-600`}>
                                                ${c.creditBalance.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-base text-right">
                                                <Button size="sm" onClick={() => openReceiveModal(c)}>Receive Payment</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                                {customersWithCreditBalance.length === 0 && <p className="text-center py-8 text-text-secondary">No outstanding customer credit balances.</p>}
                            </>
                        )}
                    </div>
                </Card>

                <Card title="Pay Bills & Expenses" action={
                    <div className="flex items-center gap-2">
                         {(['all', 'unpaid', 'paid', 'overdue'] as const).map(filter => (
                            <Button key={filter} size="sm" variant={billFilter === filter ? 'primary' : 'ghost'} onClick={() => setBillFilter(filter)}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                        ))}
                        <Button size="sm" onClick={() => setIsAddBillModalOpen(true)}>Add New Bill</Button>
                    </div>
                }>
                    <div className="max-h-[500px] overflow-y-auto">
                         <Table headers={[{ label: 'Vendor', className: 'w-[160px]' }, 'Due Date', 'Amount', { label: 'Status', className: 'w-24' }, { label: 'Action', className: 'text-right' }]}>
                             {sortedBills.map(b => {
                                 const isOverdue = b.status === 'unpaid' && new Date(b.dueDate) < new Date();
                                 return (
                                    <tr key={b.id} className={`${getBillRowClass(b)} cursor-pointer`} onClick={() => openDetailsModal(b)}>
                                        <td className="px-6 py-2 text-base font-medium text-text-primary">
                                            <div className="flex items-center">
                                                <span className="truncate" title={b.vendor}>{b.vendor}</span>
                                                {b.isRecurring && <RepeatIcon className="w-4 h-4 ml-2 text-blue-500 flex-shrink-0" title="Recurring Bill"/>}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-2 whitespace-nowrap text-base ${isOverdue ? 'text-red-500 font-semibold' : 'text-text-secondary'}`}>
                                            {new Date(b.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-text-primary">${b.amount.toFixed(2)}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base">
                                            <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${b.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base text-right">
                                            <Button size="sm" onClick={(e) => {e.stopPropagation(); openPayBillModal(b);}} disabled={b.status === 'paid'}>Pay Bill</Button>
                                        </td>
                                    </tr>
                                 );
                             })}
                         </Table>
                         {sortedBills.length === 0 && <p className="text-center py-8 text-text-secondary">No bills found for the selected filter.</p>}
                    </div>
                </Card>
            </div>
            
            <Card
                title="Transaction History"
                action={
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            variant={activeHistoryView === 'payments' ? 'primary' : 'ghost'} 
                            onClick={() => setActiveHistoryView('payments')}
                        >
                            Recent Payments
                        </Button>
                        <Button 
                            size="sm" 
                            variant={activeHistoryView === 'paidBills' ? 'primary' : 'ghost'} 
                            onClick={() => setActiveHistoryView('paidBills')}
                        >
                            Paid Bills
                        </Button>
                    </div>
                }
            >
                <div className="mb-4 space-y-4">
                    <Input
                        placeholder="Search by customer, vendor, employee, ID or description..."
                        value={historySearchTerm}
                        onChange={e => setHistorySearchTerm(e.target.value)}
                    />
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
                    {activeHistoryView === 'payments' && (
                        <div className="flex items-center gap-4 pt-2 border-t border-border">
                            <p className="font-medium text-text-secondary flex-shrink-0">Filter type:</p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant={paymentTransactionFilter === 'all' ? 'primary' : 'ghost'} onClick={() => setPaymentTransactionFilter('all')}>All Payments</Button>
                                <Button size="sm" variant={paymentTransactionFilter === 'invoice' ? 'primary' : 'ghost'} onClick={() => setPaymentTransactionFilter('invoice')}>Invoice</Button>
                                <Button size="sm" variant={paymentTransactionFilter === 'credit' ? 'primary' : 'ghost'} onClick={() => setPaymentTransactionFilter('credit')}>Credit</Button>
                            </div>
                        </div>
                    )}
                     {dateSearchError && <p className="text-red-500 text-sm">{dateSearchError}</p>}
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    {activeHistoryView === 'payments' ? (
                        <Table headers={[
                            { label: 'Receipt No.', className: 'w-40' },
                            { label: 'Date', className: 'w-48' },
                            { label: 'Employee', className: 'w-40' },
                            'Customer',
                            { label: 'Type', className: 'w-24 text-center' },
                            { label: 'Amount', className: 'w-32 text-right' },
                            { label: 'Remaining Balance', className: 'w-48 text-right' }
                        ]}>
                            {recentPayments.map(p => {
                                const isOutbound = p.type === 'outbound_bill';
                                let customerOrVendorName = '';
                                if (isOutbound) {
                                    customerOrVendorName = p.description.replace('Paid bill to ', '');
                                } else {
                                    customerOrVendorName = getCustomerName(p.referenceId);
                                }
                                
                                let typeText = '';
                                let typeClassName = '';
                                if (isOutbound) {
                                    typeText = 'Bill';
                                    typeClassName = 'bg-gray-100 text-gray-800';
                                } else {
                                    const customerType = customerTypeMap.get(p.referenceId);
                                    if (p.description.startsWith('Payment for Invoice')) {
                                        typeText = 'Invoice';
                                        typeClassName = 'bg-blue-100 text-blue-800';
                                    } else if (customerType === 'credit') {
                                        typeText = 'Credit';
                                        typeClassName = 'bg-yellow-100 text-yellow-800';
                                    } else {
                                        typeText = 'Payment';
                                        typeClassName = 'bg-green-100 text-green-800';
                                    }
                                }


                                return (
                                    <tr 
                                        key={p.id}
                                        onClick={() => openReceiptForPayment(p)}
                                        className={p.type === 'inbound_customer' ? 'cursor-pointer hover:bg-yellow-100' : ''}
                                    >
                                        <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-primary">{p.id}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(p.date).toLocaleString()}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{getEmployeeName(p.employeeId)}</td>
                                        <td className="px-6 py-2 text-base font-medium text-text-primary truncate" title={customerOrVendorName}>{customerOrVendorName}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base text-center">
                                            <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${typeClassName}`}>
                                                {typeText}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-2 whitespace-nowrap text-base font-semibold text-right ${isOutbound ? 'text-red-600' : 'text-green-600'}`}>
                                            ${p.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-right text-text-primary">
                                            {p.balanceAfterPayment !== undefined ? `$${p.balanceAfterPayment.toFixed(2)}` : 'N/A'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </Table>
                    ) : (
                        <Table headers={['Date Paid', 'Employee', { label: 'Vendor', className: 'max-w-sm' }, { label: 'Description', className: 'max-w-md' }, { label: 'Category', className: 'w-28' }, { label: 'Amount', className: 'text-right' }]}>
                            {paidBillsHistory.map(b => (
                                <tr key={b.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => setBillForReceipt(b)}>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(b.paidDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{b.employeeId ? getEmployeeName(b.employeeId) : 'N/A'}</td>
                                    <td className="px-6 py-2 text-base font-medium text-text-primary max-w-sm truncate" title={b.vendor}>{b.vendor}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary max-w-md truncate" title={b.description}>{b.description}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{b.category}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-right text-text-primary">${b.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            </Card>

            {/* Receive Credit Payment Modal */}
            <Modal
                isOpen={isReceiveModalOpen}
                onClose={closeReceiveModal}
                title={`Receive Payment from ${selectedCustomer?.name}`}
                footer={<><Button onClick={handleReceivePayment} disabled={!receivingEmployeeId}>Confirm Payment</Button><Button variant="ghost" onClick={closeReceiveModal}>Cancel</Button></>}
            >
                <div className="space-y-4">
                    <p className="text-lg">Current Balance: <span className="font-bold text-red-600">${selectedCustomer?.creditBalance.toFixed(2)}</span></p>
                    <Input
                        label="Payment Amount"
                        type="number"
                        value={paymentAmount}
                        onChange={e => {
                            setPaymentAmount(e.target.value);
                            if (paymentError) setPaymentError('');
                        }}
                        error={paymentError}
                    />
                    <Select
                        label="Received By"
                        value={receivingEmployeeId}
                        onChange={(e) => setReceivingEmployeeId(e.target.value)}
                    >
                        <option value="" disabled>Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </Select>
                </div>
            </Modal>

            {/* Receive Invoice Payment Modal */}
             <Modal
                isOpen={isInvoiceModalOpen}
                onClose={closeInvoiceModal}
                title={`Payment for Invoice #${selectedInvoice?.invoiceDetails?.invoiceNumber || selectedInvoice?.receiptNumber}`}
                footer={<><Button onClick={handleReceiveInvoicePayment} disabled={!receivingEmployeeId}>Confirm Payment</Button><Button variant="ghost" onClick={closeInvoiceModal}>Cancel</Button></>}
            >
                <div className="space-y-4">
                    <p>Customer: <span className="font-bold">{getCustomerName(selectedInvoice?.customerId || '')}</span></p>
                    <p className="text-lg">Invoice Amount: <span className="font-bold text-blue-600">${selectedInvoice?.total.toFixed(2)}</span></p>
                    <Input
                        label="Payment Amount"
                        type="number"
                        value={paymentAmount}
                        onChange={e => {
                            setPaymentAmount(e.target.value);
                            if (paymentError) setPaymentError('');
                        }}
                        error={paymentError}
                    />
                    <Select
                        label="Received By"
                        value={receivingEmployeeId}
                        onChange={(e) => setReceivingEmployeeId(e.target.value)}
                    >
                        <option value="" disabled>Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </Select>
                </div>
            </Modal>
            
            {/* Pay Bill Modal */}
            <Modal
                isOpen={isPayBillModalOpen}
                onClose={closePayBillModal}
                title="Confirm Bill Payment"
                footer={<><Button variant="secondary" onClick={handlePayBill} disabled={!payingEmployeeId}>Confirm Payment</Button><Button variant="ghost" onClick={closePayBillModal}>Cancel</Button></>}
            >
                <div className="space-y-4">
                    <p className="text-lg">
                        Are you sure you want to pay <span className="font-bold">${selectedBill?.amount.toFixed(2)}</span> to <span className="font-bold">{selectedBill?.vendor}</span>?
                    </p>
                    <Select
                        label="Paid By"
                        value={payingEmployeeId}
                        onChange={(e) => setPayingEmployeeId(e.target.value)}
                    >
                        <option value="" disabled>Select Employee</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </Select>
                    {selectedBill?.isRecurring && (
                         <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg">
                            <p className="font-bold">This is a recurring bill.</p>
                            <p>After payment, the next bill in the series will be automatically scheduled.</p>
                        </div>
                    )}
                </div>
            </Modal>
            
            {/* Bill Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={closeDetailsModal}
                title="Bill Details"
                footer={<Button variant="ghost" onClick={closeDetailsModal}>Close</Button>}
            >
                {billForDetails && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-slate-50 rounded-lg border">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Vendor</p>
                                <p className="text-lg font-semibold text-text-primary">{billForDetails.vendor}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-text-secondary">Amount</p>
                                <p className="text-2xl font-bold text-primary">${billForDetails.amount.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <div>
                                <p className="text-sm font-medium text-text-secondary">Description</p>
                                <p className="text-base text-text-primary">{billForDetails.description}</p>
                            </div>
                             <div>
                                <p className="text-sm font-medium text-text-secondary">Due Date</p>
                                <p className="text-base text-text-primary">{new Date(billForDetails.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Category</p>
                                <p className="text-base text-text-primary">{billForDetails.category}</p>
                            </div>
                             <div>
                                <p className="text-sm font-medium text-text-secondary">Status</p>
                                <p className="text-base text-text-primary capitalize">{billForDetails.status}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-secondary">Recurring</p>
                                <p className="text-base text-text-primary">
                                    {billForDetails.isRecurring 
                                        ? `Yes, every ${billForDetails.recurringDetails?.frequency} ${billForDetails.recurringDetails?.period}` 
                                        : 'No'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Bill Modal */}
            <Modal
                isOpen={isAddBillModalOpen}
                onClose={closeAddBillModal}
                title="Add New Bill or Expense"
                footer={<><Button onClick={handleAddBill}>Save Bill</Button><Button variant="ghost" onClick={closeAddBillModal}>Cancel</Button></>}
            >
                <div className="space-y-4">
                    <Input 
                        ref={vendorInputRef}
                        label="Vendor / Payee" 
                        value={newBill.vendor} 
                        onChange={e => setNewBill({...newBill, vendor: e.target.value})} 
                        error={billFormErrors.vendor}
                        onKeyDown={e => handleKeyDown(e, descriptionInputRef)}
                    />
                    <Input 
                        ref={descriptionInputRef}
                        label="Description" 
                        value={newBill.description} 
                        onChange={e => setNewBill({...newBill, description: e.target.value})} 
                        error={billFormErrors.description}
                        onKeyDown={e => handleKeyDown(e, amountInputRef)}
                    />
                    <Input 
                        ref={amountInputRef}
                        label="Amount" 
                        type="text" 
                        inputMode="decimal"
                        value={newBill.amount} 
                        onChange={handleAmountChange} 
                        error={billFormErrors.amount}
                        onKeyDown={e => handleKeyDown(e, dueDateInputRef)}
                    />
                    <Input 
                        ref={dueDateInputRef}
                        label="Due Date" 
                        type="date" 
                        value={newBill.dueDate.toISOString().split('T')[0]} 
                        onChange={e => setNewBill({...newBill, dueDate: new Date(e.target.value)})} 
                        error={billFormErrors.dueDate}
                        onKeyDown={e => handleKeyDown(e, categorySelectRef)}
                    />
                    <Select
                        ref={categorySelectRef}
                        label="Category"
                        value={newBill.category}
                        onChange={e => setNewBill({...newBill, category: e.target.value as Bill['category']})}
                        onKeyDown={e => handleKeyDown(e, newBill.isRecurring ? recurringFreqRef : undefined)}
                    >
                        {billCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>
                    
                    <div className="flex items-center">
                        <input
                            id="isRecurring"
                            type="checkbox"
                            checked={newBill.isRecurring}
                            onChange={e => {
                                const isChecked = e.target.checked;
                                setNewBill(prev => ({
                                    ...prev,
                                    isRecurring: isChecked,
                                    recurringDetails: isChecked ? { frequency: 1, period: 'months' } : undefined,
                                }));
                            }}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="isRecurring" className="ml-2 block text-base text-text-primary">
                            This is a recurring bill
                        </label>
                    </div>

                    {newBill.isRecurring && (
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-slate-50">
                             <Input
                                ref={recurringFreqRef}
                                label="Repeats every"
                                type="number"
                                value={newBill.recurringDetails?.frequency || 1}
                                onChange={e => {
                                    const frequency = parseInt(e.target.value, 10) || 1;
                                    setNewBill(prev => ({
                                        ...prev,
                                        recurringDetails: { ...prev.recurringDetails!, frequency }
                                    }));
                                }}
                                min="1"
                                onKeyDown={e => handleKeyDown(e, recurringPeriodRef)}
                            />
                            <Select
                                ref={recurringPeriodRef}
                                label="Period"
                                value={newBill.recurringDetails?.period || 'months'}
                                onChange={e => {
                                    const period = e.target.value as 'days' | 'weeks' | 'months';
                                     setNewBill(prev => ({
                                        ...prev,
                                        recurringDetails: { ...prev.recurringDetails!, period }
                                    }));
                                }}
                                onKeyDown={e => handleKeyDown(e, undefined)}
                            >
                                <option value="days">Day(s)</option>
                                <option value="weeks">Week(s)</option>
                                <option value="months">Month(s)</option>
                            </Select>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Payment Receipt Modal */}
            {receiptDetails && (
                <Modal 
                    isOpen={!!receiptDetails} 
                    onClose={() => setReceiptDetails(null)} 
                    title={`Receipt #${receiptDetails.payment.id}`}
                    size="sm"
                    footer={
                        <>
                            <Button onClick={handlePrintReceipt}>Print Receipt</Button>
                            <Button variant="ghost" onClick={() => setReceiptDetails(null)}>Close</Button>
                        </>
                    }
                >
                    <PrintablePaymentReceipt payment={receiptDetails.payment} customer={receiptDetails.customer} receiptSettings={receiptSettings} />
                </Modal>
            )}

            {/* Bill Receipt Modal */}
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

export default Payments;