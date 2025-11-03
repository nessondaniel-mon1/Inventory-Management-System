import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useInventory } from '../../hooks/useInventory';
import { generateCustomerSummary } from '../../services/geminiService';
import type { SegmentedCustomer } from '../../types';

const CrownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const UserXIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>
);

const CustomerSegmentation: React.FC = () => {
    const { customers, sales, getCustomerName } = useInventory();
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState('');

    const segments = useMemo(() => {
        const customerData: Record<string, { totalSpent: number, purchaseCount: number, lastPurchase: Date }> = {};

        sales.forEach(sale => {
            if (sale.customerId) {
                if (!customerData[sale.customerId]) {
                    customerData[sale.customerId] = { totalSpent: 0, purchaseCount: 0, lastPurchase: new Date(0) };
                }
                const data = customerData[sale.customerId];
                data.totalSpent += sale.total;
                data.purchaseCount += 1;
                if (new Date(sale.date) > data.lastPurchase) {
                    data.lastPurchase = new Date(sale.date);
                }
            }
        });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const allCustomers = Object.keys(customerData).map(id => ({ id, ...customerData[id] }));

        const vips: SegmentedCustomer[] = [...allCustomers]
            .sort((a,b) => b.totalSpent - a.totalSpent)
            .slice(0, 5)
            .map(c => ({ id: c.id, name: getCustomerName(c.id), value: c.totalSpent }));

        const loyals: SegmentedCustomer[] = [...allCustomers]
            .sort((a,b) => b.purchaseCount - a.purchaseCount)
            .slice(0, 5)
            .map(c => ({ id: c.id, name: getCustomerName(c.id), value: c.purchaseCount }));
            
        const atRisk: SegmentedCustomer[] = allCustomers
            .filter(c => c.purchaseCount > 1 && c.lastPurchase < thirtyDaysAgo)
            .sort((a,b) => a.lastPurchase.getTime() - b.lastPurchase.getTime())
            .slice(0, 5)
            .map(c => ({ id: c.id, name: getCustomerName(c.id), value: Math.round((new Date().getTime() - c.lastPurchase.getTime()) / (1000 * 3600 * 24)) })); // value is days since last purchase

        return { vips, loyals, atRisk };
    }, [customers, sales, getCustomerName]);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        const result = await generateCustomerSummary(segments.vips, segments.loyals, segments.atRisk);
        setSummary(result);
        setIsLoading(false);
    };

    return (
        <Card title="Customer Segmentation">
             <div className="mb-4">
                <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
                    {isLoading ? 'Analyzing...' : 'Generate AI Summary'}
                </Button>
            </div>
            {isLoading && !summary && (
                <div className="flex items-center justify-center h-24">
                    <Spinner size="sm" />
                    <p className="ml-4 text-text-secondary">AI is analyzing your customer data...</p>
                </div>
            )}
            {summary && (
                <div className="p-3 bg-indigo-50 border-l-4 border-primary text-primary-dark rounded-r-md mb-4">
                    <p className="font-semibold">AI Summary:</p>
                    <p>{summary}</p>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-text-primary mb-2 flex items-center"><CrownIcon className="w-5 h-5 mr-2 text-yellow-500" />VIP Customers (Top Spenders)</h4>
                    <ul className="space-y-1">
                        {segments.vips.map(c => (
                            <li key={c.id} className="flex justify-between p-1 bg-gray-50 rounded">
                                <span>{c.name}</span>
                                <span className="font-semibold">${c.value.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-text-primary mb-2 flex items-center"><HeartIcon className="w-5 h-5 mr-2 text-red-500" />Loyal Customers (Most Purchases)</h4>
                     <ul className="space-y-1">
                        {segments.loyals.map(c => (
                            <li key={c.id} className="flex justify-between p-1 bg-gray-50 rounded">
                                <span>{c.name}</span>
                                <span className="font-semibold">{c.value} purchases</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-text-primary mb-2 flex items-center"><UserXIcon className="w-5 h-5 mr-2 text-gray-500" />At-Risk Customers</h4>
                     <ul className="space-y-1">
                        {segments.atRisk.map(c => (
                            <li key={c.id} className="flex justify-between p-1 bg-gray-50 rounded">
                                <span>{c.name}</span>
                                <span className="font-semibold">{c.value} days ago</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
};

export default CustomerSegmentation;
