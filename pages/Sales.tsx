import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import { useInventory } from '../hooks/useInventory';
import type { Sale } from '../types';

const Sales: React.FC = () => {
    const { sales, getEmployeeName, getCustomerName, getProductName } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSales = useMemo(() => {
        if (!searchTerm) return sales;
        return sales.filter(sale => 
            sale.date.toLocaleDateString().includes(searchTerm) ||
            getEmployeeName(sale.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sales, searchTerm, getEmployeeName]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const calculateSales = (filterFn: (s: Sale) => boolean) => {
        const relevantSales = sales.filter(filterFn);
        const total = relevantSales.reduce((sum, s) => sum + s.total, 0);
        const credit = relevantSales.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'invoice').reduce((sum, s) => sum + s.total, 0);
        return { total, credit };
    };

    const daily = calculateSales(s => new Date(s.date) >= today);
    const weekly = calculateSales(s => new Date(s.date) >= startOfWeek);
    const monthly = calculateSales(s => new Date(s.date) >= startOfMonth);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Daily Sales"><p className="text-2xl font-bold">${daily.total.toFixed(2)}</p><p className="text-sm text-text-secondary">${daily.credit.toFixed(2)} in credit</p></Card>
                <Card title="Weekly Sales"><p className="text-2xl font-bold">${weekly.total.toFixed(2)}</p><p className="text-sm text-text-secondary">${weekly.credit.toFixed(2)} in credit</p></Card>
                <Card title="Monthly Sales"><p className="text-2xl font-bold">${monthly.total.toFixed(2)}</p><p className="text-sm text-text-secondary">${monthly.credit.toFixed(2)} in credit</p></Card>
            </div>
            
            <Card title="Sales History">
                <div className="mb-4">
                    <Input 
                        placeholder="Search by date, employee or receipt..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Table headers={['Receipt', 'Date', 'Employee', 'Customer', 'Items', 'Total', 'Payment', 'Status']}>
                    {filteredSales.map(sale => (
                        <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{sale.receiptNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(sale.date).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getEmployeeName(sale.employeeId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{sale.customerId ? getCustomerName(sale.customerId) : 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-text-secondary">
                                {sale.items.map(item => (
                                    <div key={item.productId}>{getProductName(item.productId)} x {item.quantity}</div>
                                ))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">${sale.total.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">{sale.paymentMethod}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    sale.paymentStatus === 'credit' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {sale.paymentStatus}
                                </span>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
};

export default Sales;