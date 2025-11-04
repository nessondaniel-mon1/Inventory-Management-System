import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import StatCard from '../components/dashboard/StatCard';
import SalesChart from '../components/dashboard/SalesChart';
import ProfitTrendChart from '../components/dashboard/ProfitTrendChart';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Page, Sale, Payment, Bill } from '../types';

const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>;
const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const PackageWarningIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M14 15.5V13a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2.5"/><path d="M15 9.5 8.5 16"/><path d="m21.7 17-5.4 6.2-5.4-6.2"/><path d="M16.3 23.2V17"/></svg>;
const ArchiveIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>;
const ShoppingCartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const PackagePlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0"/><path d="M12 12.9a7.5 7.5 0 0 1 7.4-6 4.5 4.5 0 1 1-2.5 8.2"/><path d="M12 12.9a7.5 7.5 0 0 0-7.4-6 4.5 4.5 0 1 0 2.5 8.2"/><path d="M12 12.9v10.1"/><path d="M12 18.5a2.5 2.5 0 0 1-2.5-2.5h5a2.5 2.5 0 0 1-2.5 2.5Z"/><line x1="8" y1="2.5" x2="16" y2="2.5"/><line x1="12" y1="0" x2="12" y2="5"/></svg>;
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 17.5 17.5 14"/><path d="M22 17.5 17.5 21"/><path d="M10 5H8.3C7.5 5 7 5.5 7 6.3V17"/><path d="M14 5h2.7c.8 0 1.3.5 1.3 1.3V17"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12"/><path d="M16 12h-4a2 2 0 0 0 0 4h4a2 2 0 0 0 0-4Z"/></svg>;
const ReceiptIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h6"/><path d="M12 17V7"/></svg>;

interface DashboardProps {
    setCurrentPage: (page: Page) => void;
}

const CashFlowChart: React.FC = () => {
    const { payments } = useInventory();
    const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const cashFlowData = useMemo(() => {
        const filterFn = (date: Date) => {
            if (timeFrame === 'daily') return date >= today;
            if (timeFrame === 'weekly') return date >= startOfWeek;
            return date >= startOfMonth;
        };

        const inflow = payments
            .filter(p => p.type === 'inbound_customer' && filterFn(new Date(p.date)))
            .reduce((sum, p) => sum + p.amount, 0);

        const outflow = payments
            .filter(p => p.type === 'outbound_bill' && filterFn(new Date(p.date)))
            .reduce((sum, p) => sum + p.amount, 0);

        return [{ name: 'Cash Flow', Inflow: inflow, Outflow: outflow }];
    }, [payments, timeFrame, today, startOfWeek, startOfMonth]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cash Flow</h3>
                <div className="space-x-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(frame => (
                         <Button key={frame} size="sm" variant={timeFrame === frame ? 'primary' : 'ghost'} onClick={() => setTimeFrame(frame)}>
                            {frame.charAt(0).toUpperCase() + frame.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <BarChart data={cashFlowData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Inflow" fill="#10b981" />
                        <Bar dataKey="Outflow" fill="#ef4444" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
    const { sales, products, customers, bills, getPurchaseCost, supplies, getSupplierName, payments } = useInventory();
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // --- KPI Calculations ---
    const calculateSales = (filterFn: (s: Sale) => boolean) => {
        const relevantSales = sales.filter(filterFn);
        const total = relevantSales.reduce((sum, s) => sum + s.total, 0);
        const profit = relevantSales.reduce((sum, s) => sum + s.profit, 0);
        return { total, profit };
    };

    const calculatePayments = (filterFn: (p: Payment) => boolean) => {
        const relevantPayments = payments.filter(filterFn);
        const received = relevantPayments
            .filter(p => p.type === 'inbound_customer')
            .reduce((sum, p) => sum + p.amount, 0);
        const paid = relevantPayments
            .filter(p => p.type === 'outbound_bill')
            .reduce((sum, p) => sum + p.amount, 0);
        return { received, paid };
    };
    
    const dailySales = calculateSales(s => new Date(s.date) >= today);
    const dailyPayments = calculatePayments(p => new Date(p.date) >= today);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdaySales = calculateSales(s => {
        const saleDate = new Date(s.date);
        return saleDate >= yesterday && saleDate < today;
    });
    const yesterdayPayments = calculatePayments(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= yesterday && paymentDate < today;
    });

    const getChange = (current: number, previous: number) => {
        if (previous === 0) return { text: current > 0 ? '+∞%' : '0%', type: 'increase' as const };
        const percentChange = ((current - previous) / previous) * 100;
        return {
            text: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%`,
            type: percentChange >= 0 ? 'increase' as const : 'decrease' as const
        };
    };

    const salesChange = getChange(dailySales.total, yesterdaySales.total);
    const profitChange = getChange(dailySales.profit, yesterdaySales.profit);
    const paymentsReceivedChange = getChange(dailyPayments.received, yesterdayPayments.received);
    const billsPaidChange = getChange(dailyPayments.paid, yesterdayPayments.paid);

    const totalOwed = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    const overdueBillsCount = bills.filter(b => b.status === 'unpaid' && new Date(b.dueDate) < today).length;
    const totalInventoryValue = useMemo(() => {
        return products.reduce((sum, p) => sum + (p.stock * getPurchaseCost(p.id)), 0);
    }, [products, getPurchaseCost]);
    
    // --- Detailed Sales View Calculations ---
    const detailedSales = useMemo(() => {
        const daily = sales.filter(s => new Date(s.date) >= today);
        const weekly = sales.filter(s => new Date(s.date) >= startOfWeek);
        const monthly = sales.filter(s => new Date(s.date) >= startOfMonth);
        return { daily, weekly, monthly };
    }, [sales, today, startOfWeek, startOfMonth]);

    const calculateDetailedMetrics = (salesPeriod: Sale[]) => {
        const total = salesPeriod.reduce((sum, s) => sum + s.total, 0);
        const profit = salesPeriod.reduce((sum, s) => sum + s.profit, 0);
        return {
            total,
            profit,
            margin: total > 0 ? (profit / total) * 100 : 0,
            cash: salesPeriod.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.total, 0),
            credit: salesPeriod.filter(s => s.paymentStatus === 'credit').reduce((sum, s) => sum + s.total, 0),
            invoice: salesPeriod.filter(s => s.paymentStatus === 'invoice').reduce((sum, s) => sum + s.total, 0)
        };
    };

    const dailyDetailed = calculateDetailedMetrics(detailedSales.daily);
    const weeklyDetailed = calculateDetailedMetrics(detailedSales.weekly);
    const monthlyDetailed = calculateDetailedMetrics(detailedSales.monthly);
    
    // --- Detailed Payment Calculations ---
    const detailedPayments = useMemo(() => {
        const daily = payments.filter(p => new Date(p.date) >= today);
        const weekly = payments.filter(p => new Date(p.date) >= startOfWeek);
        const monthly = payments.filter(p => new Date(p.date) >= startOfMonth);
        return { daily, weekly, monthly };
    }, [payments, today, startOfWeek, startOfMonth]);

    const calculateDetailedReceived = (paymentsPeriod: Payment[]) => {
        const inbound = paymentsPeriod.filter(p => p.type === 'inbound_customer');
        return {
            total: inbound.reduce((sum, p) => sum + p.amount, 0),
            credit: inbound.filter(p => !p.description.startsWith('Payment for Invoice')).reduce((sum, p) => sum + p.amount, 0),
            invoice: inbound.filter(p => p.description.startsWith('Payment for Invoice')).reduce((sum, p) => sum + p.amount, 0),
        };
    };

    const dailyDetailedReceived = useMemo(() => calculateDetailedReceived(detailedPayments.daily), [detailedPayments.daily]);
    const weeklyDetailedReceived = useMemo(() => calculateDetailedReceived(detailedPayments.weekly), [detailedPayments.weekly]);
    const monthlyDetailedReceived = useMemo(() => calculateDetailedReceived(detailedPayments.monthly), [detailedPayments.monthly]);

    const calculateDetailedBillsPaid = (paymentsPeriod: Payment[], allBills: Bill[]) => {
        const billMap = new Map(allBills.map(b => [b.id, b]));
        const outboundPayments = paymentsPeriod.filter(p => p.type === 'outbound_bill');
        
        const result = { recurring: 0, oneTime: 0 };

        for (const payment of outboundPayments) {
            const bill = billMap.get(payment.referenceId);
            if (bill && bill.isRecurring) {
                result.recurring += payment.amount;
            } else {
                result.oneTime += payment.amount;
            }
        }

        return {
            total: result.recurring + result.oneTime,
            recurring: result.recurring,
            oneTime: result.oneTime,
        };
    };

    const dailyDetailedBillsPaid = useMemo(() => calculateDetailedBillsPaid(detailedPayments.daily, bills), [detailedPayments.daily, bills]);
    const weeklyDetailedBillsPaid = useMemo(() => calculateDetailedBillsPaid(detailedPayments.weekly, bills), [detailedPayments.weekly, bills]);
    const monthlyDetailedBillsPaid = useMemo(() => calculateDetailedBillsPaid(detailedPayments.monthly, bills), [detailedPayments.monthly, bills]);

    // --- Other Card Calculations ---
    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock > 0 && p.stock < 10).sort((a,b) => a.stock - b.stock);
    }, [products]);

    const topSuppliersBySpend = useMemo(() => {
        // FIX: The previous reduce function was causing a type inference issue with its accumulator, leading to an arithmetic error in the sort method. Replaced with a standard for-of loop for clearer and more robust type safety.
        const spendBySupplier: Record<string, number> = {};
        for (const supply of supplies) {
            const cost = supply.quantity * supply.unitCost;
            spendBySupplier[supply.supplierId] = (spendBySupplier[supply.supplierId] || 0) + cost;
        }
    
        return Object.entries(spendBySupplier)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id, total]) => ({
                id,
                name: getSupplierName(id),
                total
            }));
    }, [supplies, getSupplierName]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button size="lg" className="w-full" onClick={() => setCurrentPage('accounting')} leftIcon={<ShoppingCartIcon className="w-5 h-5" />}>New Sale</Button>
                <Button size="lg" className="w-full" onClick={() => setCurrentPage('payments')} leftIcon={<WalletIcon className="w-5 h-5" />}>Receive Payment</Button>
                <Button size="lg" className="w-full" onClick={() => setCurrentPage('products')} leftIcon={<PackagePlusIcon className="w-5 h-5" />}>Add Product</Button>
                <Button size="lg" className="w-full" onClick={() => setCurrentPage('suppliers')} leftIcon={<TruckIcon className="w-5 h-5" />}>Add Supplier</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Sales" value={`$${dailySales.total.toFixed(2)}`} icon={<DollarSignIcon />} color="#4f46e5" change={salesChange.text} changeType={salesChange.type} />
                <StatCard title="Today's Profit" value={`$${dailySales.profit.toFixed(2)}`} icon={<TrendingUpIcon />} color="#10b981" change={profitChange.text} changeType={profitChange.type} />
                <StatCard title="Today's Payments" value={`$${dailyPayments.received.toFixed(2)}`} icon={<WalletIcon />} color="#3b82f6" change={paymentsReceivedChange.text} changeType={paymentsReceivedChange.type} />
                <StatCard title="Total Owed To You" value={`$${totalOwed.toFixed(2)}`} icon={<CreditCardIcon />} color="#f59e0b" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Bills Paid Today" value={`$${dailyPayments.paid.toFixed(2)}`} icon={<ReceiptIcon />} color="#ef4444" change={billsPaidChange.text} changeType={billsPaidChange.type} />
                <StatCard title="Inventory Value" value={`$${totalInventoryValue.toFixed(2)}`} icon={<ArchiveIcon />} color="#3b82f6" />
                <StatCard title="Overdue Bills" value={`${overdueBillsCount}`} icon={<AlertTriangleIcon />} color="#ef4444" />
            </div>

            <div className="text-center">
                 <Button variant="ghost" onClick={() => setIsDetailsVisible(!isDetailsVisible)}>
                    {isDetailsVisible ? 'Hide Detailed View' : 'Show Detailed View'}
                    {isDetailsVisible ? <ChevronUpIcon className="ml-2 h-4 w-4" /> : <ChevronDownIcon className="ml-2 h-4 w-4" />}
                </Button>
            </div>

            <div
                 className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isDetailsVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Daily Sales">
                        <p className="text-2xl font-bold mb-2">${dailyDetailed.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                            <p>Cash Sales: <span className="font-semibold text-text-primary float-right">${dailyDetailed.cash.toFixed(2)}</span></p>
                            <p>Credit Sales: <span className="font-semibold text-text-primary float-right">${dailyDetailed.credit.toFixed(2)}</span></p>
                            <p>Invoice Sales: <span className="font-semibold text-text-primary float-right">${dailyDetailed.invoice.toFixed(2)}</span></p>
                        </div>
                    </Card>
                    <Card title="Weekly Sales">
                        <p className="text-2xl font-bold mb-2">${weeklyDetailed.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                             <p>Cash Sales: <span className="font-semibold text-text-primary float-right">${weeklyDetailed.cash.toFixed(2)}</span></p>
                            <p>Credit Sales: <span className="font-semibold text-text-primary float-right">${weeklyDetailed.credit.toFixed(2)}</span></p>
                            <p>Invoice Sales: <span className="font-semibold text-text-primary float-right">${weeklyDetailed.invoice.toFixed(2)}</span></p>
                        </div>
                    </Card>
                    <Card title="Monthly Sales">
                        <p className="text-2xl font-bold mb-2">${monthlyDetailed.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                             <p>Cash Sales: <span className="font-semibold text-text-primary float-right">${monthlyDetailed.cash.toFixed(2)}</span></p>
                            <p>Credit Sales: <span className="font-semibold text-text-primary float-right">${monthlyDetailed.credit.toFixed(2)}</span></p>
                            <p>Invoice Sales: <span className="font-semibold text-text-primary float-right">${monthlyDetailed.invoice.toFixed(2)}</span></p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <Card title="Daily Payments">
                        <p className="text-2xl font-bold mb-2">${dailyDetailedReceived.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                            <p>Credit Payments: <span className="font-semibold text-text-primary float-right">${dailyDetailedReceived.credit.toFixed(2)}</span></p>
                            <p>Invoice Payments: <span className="font-semibold text-text-primary float-right">${dailyDetailedReceived.invoice.toFixed(2)}</span></p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xl font-bold mb-2 text-red-600">Bills Paid: ${dailyDetailedBillsPaid.total.toFixed(2)}</p>
                            <div className="space-y-1 text-base text-text-secondary">
                                <p>Recurring Bills: <span className="font-semibold text-text-primary float-right">${dailyDetailedBillsPaid.recurring.toFixed(2)}</span></p>
                                <p>One-time Bills: <span className="font-semibold text-text-primary float-right">${dailyDetailedBillsPaid.oneTime.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </Card>
                     <Card title="Weekly Payments">
                        <p className="text-2xl font-bold mb-2">${weeklyDetailedReceived.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                            <p>Credit Payments: <span className="font-semibold text-text-primary float-right">${weeklyDetailedReceived.credit.toFixed(2)}</span></p>
                            <p>Invoice Payments: <span className="font-semibold text-text-primary float-right">${weeklyDetailedReceived.invoice.toFixed(2)}</span></p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xl font-bold mb-2 text-red-600">Bills Paid: ${weeklyDetailedBillsPaid.total.toFixed(2)}</p>
                            <div className="space-y-1 text-base text-text-secondary">
                                <p>Recurring Bills: <span className="font-semibold text-text-primary float-right">${weeklyDetailedBillsPaid.recurring.toFixed(2)}</span></p>
                                <p>One-time Bills: <span className="font-semibold text-text-primary float-right">${weeklyDetailedBillsPaid.oneTime.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </Card>
                     <Card title="Monthly Payments">
                        <p className="text-2xl font-bold mb-2">${monthlyDetailedReceived.total.toFixed(2)}</p>
                        <div className="space-y-1 text-base text-text-secondary">
                            <p>Credit Payments: <span className="font-semibold text-text-primary float-right">${monthlyDetailedReceived.credit.toFixed(2)}</span></p>
                            <p>Invoice Payments: <span className="font-semibold text-text-primary float-right">${monthlyDetailedReceived.invoice.toFixed(2)}</span></p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xl font-bold mb-2 text-red-600">Bills Paid: ${monthlyDetailedBillsPaid.total.toFixed(2)}</p>
                            <div className="space-y-1 text-base text-text-secondary">
                                <p>Recurring Bills: <span className="font-semibold text-text-primary float-right">${monthlyDetailedBillsPaid.recurring.toFixed(2)}</span></p>
                                <p>One-time Bills: <span className="font-semibold text-text-primary float-right">${monthlyDetailedBillsPaid.oneTime.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <Card title="Daily Gross Profit">
                        <div className="flex items-center mb-2">
                            <TrendingUpIcon className="w-8 h-8 text-secondary mr-4" />
                            <p className="text-3xl font-bold text-secondary">${dailyDetailed.profit.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1 text-base text-text-secondary border-t border-border pt-2 mt-2">
                            <p>Total Sales: <span className="font-semibold text-text-primary float-right">${dailyDetailed.total.toFixed(2)}</span></p>
                            <p>Profit Margin: <span className="font-semibold text-text-primary float-right">{dailyDetailed.margin.toFixed(1)}%</span></p>
                        </div>
                    </Card>
                     <Card title="Weekly Gross Profit">
                        <div className="flex items-center mb-2">
                            <TrendingUpIcon className="w-8 h-8 text-secondary mr-4" />
                            <p className="text-3xl font-bold text-secondary">${weeklyDetailed.profit.toFixed(2)}</p>
                        </div>
                         <div className="space-y-1 text-base text-text-secondary border-t border-border pt-2 mt-2">
                            <p>Total Sales: <span className="font-semibold text-text-primary float-right">${weeklyDetailed.total.toFixed(2)}</span></p>
                            <p>Profit Margin: <span className="font-semibold text-text-primary float-right">{weeklyDetailed.margin.toFixed(1)}%</span></p>
                        </div>
                    </Card>
                     <Card title="Monthly Gross Profit">
                        <div className="flex items-center mb-2">
                            <TrendingUpIcon className="w-8 h-8 text-secondary mr-4" />
                            <p className="text-3xl font-bold text-secondary">${monthlyDetailed.profit.toFixed(2)}</p>
                        </div>
                         <div className="space-y-1 text-base text-text-secondary border-t border-border pt-2 mt-2">
                            <p>Total Sales: <span className="font-semibold text-text-primary float-right">${monthlyDetailed.total.toFixed(2)}</span></p>
                            <p>Profit Margin: <span className="font-semibold text-text-primary float-right">{monthlyDetailed.margin.toFixed(1)}%</span></p>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesChart />
                <ProfitTrendChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Urgent Alerts">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        <div className="flex items-start">
                            <PackageWarningIcon className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold text-text-primary">Low Stock Items</h4>
                                {lowStockProducts.length > 0 ? (
                                    <ul className="list-disc pl-5 text-base text-text-secondary">
                                        {lowStockProducts.map(p => (
                                            <li key={p.id}>
                                                {p.name} - <span className="font-bold text-red-600">{p.stock} left</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-base text-text-secondary">All stock levels are healthy.</p>}
                            </div>
                        </div>
                    </div>
                </Card>
                
                <Card title="Top Suppliers by Spend">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {topSuppliersBySpend.map((supplier, index) => (
                            <div key={supplier.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-text-secondary mr-3">{index + 1}.</span>
                                    <p className="font-semibold text-text-primary truncate">{supplier.name}</p>
                                </div>
                                <p className="font-bold text-primary">${supplier.total.toFixed(2)}</p>
                            </div>
                        ))}
                         {topSuppliersBySpend.length === 0 && <p className="text-center text-text-secondary py-8">No supply data available.</p>}
                    </div>
                </Card>
                
                <CashFlowChart />
            </div>
        </div>
    );
};

export default Dashboard;