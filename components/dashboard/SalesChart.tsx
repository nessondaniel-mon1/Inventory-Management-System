import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import type { Sale } from '../../types';
import { useInventory } from '../../hooks/useInventory';
import Button from '../ui/Button';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const SalesChart: React.FC = () => {
    const { sales } = useInventory();
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
    
    const processData = (sales: Sale[], frame: TimeFrame) => {
        const dataMap = new Map<string, { name: string; cash: number; credit: number }>();
        
        sales.forEach(sale => {
            let key: string;
            const saleDate = new Date(sale.date);
            if (frame === 'daily') {
                key = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (frame === 'weekly') {
                const startOfWeek = new Date(saleDate);
                startOfWeek.setDate(saleDate.getDate() - saleDate.getDay());
                key = `Wk ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else { // monthly
                key = saleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            if (!dataMap.has(key)) {
                dataMap.set(key, { name: key, cash: 0, credit: 0 });
            }
            const entry = dataMap.get(key)!;

            if (sale.paymentStatus === 'credit' || sale.paymentStatus === 'invoice') {
                entry.credit += sale.total;
            } else {
                entry.cash += sale.total;
            }
        });

        return Array.from(dataMap.values()).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    };
    
    const chartData = processData(sales, timeFrame);
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sales Overview</h3>
                <div className="space-x-2">
                    {(['daily', 'weekly', 'monthly'] as TimeFrame[]).map(frame => (
                         <Button key={frame} size="sm" variant={timeFrame === frame ? 'primary' : 'ghost'} onClick={() => setTimeFrame(frame)}>
                            {frame.charAt(0).toUpperCase() + frame.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cash" stackId="a" fill="#10b981" name="Cash Sales" />
                        <Bar dataKey="credit" stackId="a" fill="#f59e0b" name="Credit/Invoice" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SalesChart;