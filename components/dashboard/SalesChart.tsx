import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import type { Sale } from '../../types';
import { useInventory } from '../../hooks/useInventory';
import Button from '../ui/Button';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const SalesChart: React.FC = () => {
    const { sales } = useInventory();
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
    
    const processData = (sales: Sale[], frame: TimeFrame) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        // A map to store sales aggregated by day (YYYY-MM-DD). This is the base for all calculations.
        const salesByDate = new Map<string, { cash: number; credit: number }>();
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const dateKey = `${saleDate.getFullYear()}-${pad(saleDate.getMonth() + 1)}-${pad(saleDate.getDate())}`;
            if (!salesByDate.has(dateKey)) {
                salesByDate.set(dateKey, { cash: 0, credit: 0 });
            }
            const entry = salesByDate.get(dateKey)!;
            if (sale.paymentStatus === 'credit' || sale.paymentStatus === 'invoice') {
                entry.credit += sale.total;
            } else {
                entry.cash += sale.total;
            }
        });
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        if (frame === 'daily') {
            const data = [];
            // Generate data for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                const salesData = salesByDate.get(dateKey) || { cash: 0, credit: 0 };
                data.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    cash: salesData.cash,
                    credit: salesData.credit,
                });
            }
            return data;
        }
    
        if (frame === 'weekly') {
            // Aggregate daily sales into weekly buckets
            const weeklyData = new Map<string, { cash: number; credit: number }>();
            salesByDate.forEach((value, dateKey) => {
                const date = new Date(dateKey + 'T12:00:00'); // Use noon to avoid timezone boundary issues
                const dayOfWeek = date.getDay();
                const weekStartDate = new Date(date);
                weekStartDate.setDate(date.getDate() - dayOfWeek);
                const weekKey = weekStartDate.toISOString().split('T')[0];
    
                if (!weeklyData.has(weekKey)) {
                    weeklyData.set(weekKey, { cash: 0, credit: 0 });
                }
                const entry = weeklyData.get(weekKey)!;
                entry.cash += value.cash;
                entry.credit += value.credit;
            });
    
            const data = [];
            // Generate data for the last 4 weeks
            const currentWeekStart = new Date(today);
            currentWeekStart.setDate(today.getDate() - today.getDay());
    
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(currentWeekStart);
                weekStart.setDate(currentWeekStart.getDate() - (i * 7));
                const weekKey = weekStart.toISOString().split('T')[0];
                const salesData = weeklyData.get(weekKey) || { cash: 0, credit: 0 };
                data.push({
                    name: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    cash: salesData.cash,
                    credit: salesData.credit,
                });
            }
            return data;
        }
        
        if (frame === 'monthly') {
            // Aggregate daily sales into monthly buckets
            const monthlyData = new Map<string, { cash: number; credit: number }>();
            salesByDate.forEach((value, dateKey) => {
                const monthKey = dateKey.substring(0, 7); // YYYY-MM
                if (!monthlyData.has(monthKey)) {
                    monthlyData.set(monthKey, { cash: 0, credit: 0 });
                }
                const entry = monthlyData.get(monthKey)!;
                entry.cash += value.cash;
                entry.credit += value.credit;
            });
    
            const data = [];
            // Generate data for the last 6 months
            const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentMonth);
                date.setMonth(currentMonth.getMonth() - i);
                const monthKey = date.toISOString().substring(0, 7);
                const salesData = monthlyData.get(monthKey) || { cash: 0, credit: 0 };
                data.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    cash: salesData.cash,
                    credit: salesData.credit,
                });
            }
            return data;
        }
    
        return [];
    };

    const chartData = processData(sales, timeFrame);

    const maxVal = Math.max(...chartData.map(d => d.cash + d.credit), 5000000);
    const tickInterval = 1000000;
    const ticks = [];
    for (let i = tickInterval; i <= maxVal; i += tickInterval) {
        ticks.push(i);
    }

    const formatYAxis = (tick: number) => {
        if (tick >= 1000000) {
            return `${tick / 1000000}M`;
        }
        if (tick >= 1000) {
            return `${tick / 1000}K`;
        }
        return tick;
    };
    
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
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} ticks={ticks} domain={[0, 'dataMax']} tickFormatter={formatYAxis} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cash" stackId="a" fill="#10b981" name="Cash Sales" maxBarSize={40} />
                        <Bar dataKey="credit" stackId="a" fill="#f59e0b" name="Credit/Invoice" maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};


export default SalesChart;