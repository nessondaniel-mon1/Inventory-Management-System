import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import type { Sale } from '../../types';
import { useInventory } from '../../hooks/useInventory';
import Button from '../ui/Button';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const ProfitTrendChart: React.FC = () => {
    const { sales } = useInventory();
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
    
    const processData = (sales: Sale[], frame: TimeFrame) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const profitByDate = new Map<string, number>();
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const dateKey = `${saleDate.getFullYear()}-${pad(saleDate.getMonth() + 1)}-${pad(saleDate.getDate())}`;
            const currentProfit = profitByDate.get(dateKey) || 0;
            profitByDate.set(dateKey, currentProfit + sale.profit);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (frame === 'daily') {
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                data.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    profit: profitByDate.get(dateKey) || 0,
                });
            }
            return data;
        }

        if (frame === 'weekly') {
            const weeklyData = new Map<string, number>();
            profitByDate.forEach((profit, dateKey) => {
                const date = new Date(dateKey + 'T12:00:00');
                const dayOfWeek = date.getDay();
                const weekStartDate = new Date(date);
                weekStartDate.setDate(date.getDate() - dayOfWeek);
                const weekKey = weekStartDate.toISOString().split('T')[0];
                const currentProfit = weeklyData.get(weekKey) || 0;
                weeklyData.set(weekKey, currentProfit + profit);
            });

            const data = [];
            const currentWeekStart = new Date(today);
            currentWeekStart.setDate(today.getDate() - today.getDay());
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(currentWeekStart);
                weekStart.setDate(currentWeekStart.getDate() - (i * 7));
                const weekKey = weekStart.toISOString().split('T')[0];
                data.push({
                    name: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    profit: weeklyData.get(weekKey) || 0,
                });
            }
            return data;
        }

        if (frame === 'monthly') {
            const monthlyData = new Map<string, number>();
            profitByDate.forEach((profit, dateKey) => {
                const monthKey = dateKey.substring(0, 7); // YYYY-MM
                const currentProfit = monthlyData.get(monthKey) || 0;
                monthlyData.set(monthKey, currentProfit + profit);
            });

            const data = [];
            const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentMonth);
                date.setMonth(currentMonth.getMonth() - i);
                const monthKey = date.toISOString().substring(0, 7);
                data.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    profit: monthlyData.get(monthKey) || 0,
                });
            }
            return data;
        }
        return [];
    };

    const chartData = processData(sales, timeFrame);

    const maxVal = Math.max(...chartData.map(d => d.profit), 5000000);
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
                <h3 className="text-lg font-semibold">Profit Trend</h3>
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
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} ticks={ticks} domain={[0, 'dataMax']} tickFormatter={formatYAxis} />
                        <Tooltip formatter={(value: number) => `shs {value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};


export default ProfitTrendChart;