import React from 'react';
import { useInventory } from '../hooks/useInventory';
import StatCard from '../components/dashboard/StatCard';
import SalesChart from '../components/dashboard/SalesChart';
import Card from '../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0"/><path d="M12 12.9a7.5 7.5 0 0 1 7.4-6 4.5 4.5 0 1 1-2.5 8.2"/><path d="M12 12.9a7.5 7.5 0 0 0-7.4-6 4.5 4.5 0 1 0 2.5 8.2"/><path d="M12 12.9v10.1"/><path d="M12 18.5a2.5 2.5 0 0 1-2.5-2.5h5a2.5 2.5 0 0 1-2.5 2.5Z"/></svg>;
const CreditCardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>;


const Dashboard: React.FC = () => {
    const { sales, products, customers, getProductName } = useInventory();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailySales = sales.filter(s => new Date(s.date) >= today).reduce((sum, s) => sum + s.total, 0);
    const weeklySales = sales.filter(s => new Date(s.date) >= startOfWeek).reduce((sum, s) => sum + s.total, 0);
    const monthlySales = sales.filter(s => new Date(s.date) >= startOfMonth).reduce((sum, s) => sum + s.total, 0);
    const totalCredits = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    const totalProducts = products.length;

    const stockData = products.slice(0, 5).map(p => ({ name: p.name, value: p.stock }));
    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    // FIX: Add explicit type `Record<string, number>` to ensure TypeScript correctly infers the array type for `Object.entries`.
    const popularProductsData: Record<string, number> = sales.flatMap(s => s.items)
        .reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);

    const sortedPopularProducts = Object.entries(popularProductsData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, quantity]) => ({ name: getProductName(productId), quantity }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Daily Sales" value={`$${dailySales.toFixed(2)}`} icon={<DollarSignIcon />} color="#4f46e5" />
                <StatCard title="Weekly Sales" value={`$${weeklySales.toFixed(2)}`} icon={<DollarSignIcon />} color="#10b981" />
                <StatCard title="Total Credits" value={`$${totalCredits.toFixed(2)}`} icon={<CreditCardIcon />} color="#f59e0b" />
                <StatCard title="Total Products" value={totalProducts.toString()} icon={<PackageIcon />} color="#ef4444" />
            </div>

            <SalesChart />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Product Stock Levels (Top 5)">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {stockData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Most Popular Products">
                     <ul className="space-y-4">
                        {sortedPopularProducts.map((p, index) => (
                            <li key={p.name} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-gray-400 mr-4">{index + 1}</span>
                                    <span className="font-semibold text-text-primary">{p.name}</span>
                                </div>
                                <span className="text-lg font-bold text-primary">{p.quantity} <span className="text-sm font-normal text-text-secondary">sold</span></span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
