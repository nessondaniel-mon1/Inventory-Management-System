import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useInventory } from '../../hooks/useInventory';
import { generateForecast } from '../../services/geminiService';
import type { ForecastDataPoint, Sale } from '../../types';

const SalesForecastChart: React.FC = () => {
    const { sales } = useInventory();
    const [timeFrame, setTimeFrame] = useState<7 | 14 | 30>(7);
    const [chartData, setChartData] = useState<ForecastDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const prepareAndFetchForecast = async () => {
            setIsLoading(true);

            // 1. Prepare historical data (last 90 days)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const historicalSales = sales.filter(s => new Date(s.date) >= ninetyDaysAgo);

            const salesByDate = new Map<string, { sales: number; profit: number }>();
            historicalSales.forEach(sale => {
                const dateKey = new Date(sale.date).toISOString().split('T')[0];
                const entry = salesByDate.get(dateKey) || { sales: 0, profit: 0 };
                entry.sales += sale.total;
                entry.profit += sale.profit;
                salesByDate.set(dateKey, entry);
            });
            
            // 2. Generate historical data points for the chart (last 7 days)
            const today = new Date();
            const historicalChartPoints: ForecastDataPoint[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                const data = salesByDate.get(dateKey) || { sales: 0, profit: 0 };
                historicalChartPoints.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    sales: data.sales,
                    profit: data.profit,
                });
            }

            // 3. Fetch forecast from AI
            const forecastResult = await generateForecast(historicalSales, timeFrame);
            
            // 4. Combine historical and forecast data
            const forecastChartPoints: ForecastDataPoint[] = [];
            for (let i = 0; i < timeFrame; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i + 1); // Start from tomorrow
                forecastChartPoints.push({
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    sales: null,
                    profit: null,
                    forecastSales: forecastResult.sales[i] || 0,
                    forecastProfit: forecastResult.profit[i] || 0,
                });
            }
            
            // Connect the last historical point to the first forecast point for a continuous line
            const lastHistoricalPoint = historicalChartPoints[historicalChartPoints.length - 1];
            if (lastHistoricalPoint && forecastChartPoints.length > 0) {
                 forecastChartPoints[0] = {
                    ...forecastChartPoints[0],
                    sales: lastHistoricalPoint.sales,
                    profit: lastHistoricalPoint.profit,
                };
            }

            setChartData([...historicalChartPoints, ...forecastChartPoints]);
            setIsLoading(false);
        };
        
        prepareAndFetchForecast();

    }, [sales, timeFrame]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">AI Sales & Profit Forecast</h3>
                <div className="space-x-2">
                    {([7, 14, 30] as const).map(frame => (
                         <Button key={frame} size="sm" variant={timeFrame === frame ? 'primary' : 'ghost'} onClick={() => setTimeFrame(frame)}>
                            {frame} Days
                        </Button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Spinner />
                        <p className="ml-4 text-text-secondary">Generating AI forecast...</p>
                    </div>
                ) : (
                    <ResponsiveContainer>
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `shs {value}`} />
                            <Tooltip formatter={(value: number) => `shs {value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="sales" name="Historical Sales" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="profit" name="Historical Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="forecastSales" name="Forecast Sales" stroke="#4f46e5" strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="forecastProfit" name="Forecast Profit" stroke="#10b981" strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
};

export default SalesForecastChart;
