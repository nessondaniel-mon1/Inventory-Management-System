import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Table from '../ui/Table';
import { useInventory } from '../../hooks/useInventory';
import { generateReorderSuggestions } from '../../services/geminiService';
import type { ReorderSuggestion } from '../../types';

const InventoryInsights: React.FC = () => {
    const { products, sales } = useInventory();
    const [activeTab, setActiveTab] = useState<'alerts' | 'ai'>('alerts');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock > 0 && p.stock < 10).sort((a,b) => a.stock - b.stock);
    }, [products]);

    const slowMovingProducts = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const salesInLast30Days = new Map<string, number>();

        sales
            .filter(s => new Date(s.date) >= thirtyDaysAgo)
            .forEach(s => {
                s.items.forEach(item => {
                    salesInLast30Days.set(item.productId, (salesInLast30Days.get(item.productId) || 0) + item.quantity);
                });
            });
        
        return products
            .filter(p => p.stock > 0 && (salesInLast30Days.get(p.id) || 0) < 5)
            .sort((a,b) => (salesInLast30Days.get(a.id) || 0) - (salesInLast30Days.get(b.id) || 0));
    }, [products, sales]);
    
    const handleGenerateSuggestions = async () => {
        setIsLoading(true);
        setSuggestions([]);
        const result = await generateReorderSuggestions(products, sales);
        setSuggestions(result);
        setIsLoading(false);
    };

    return (
        <Card title="Inventory Insights">
            <div className="flex border-b mb-4">
                <button 
                    onClick={() => setActiveTab('alerts')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'alerts' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                >
                    Alerts
                </button>
                <button 
                    onClick={() => setActiveTab('ai')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
                >
                    AI Reorder Suggestions
                </button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'alerts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-text-primary mb-2">Low Stock Items ({lowStockProducts.length})</h4>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                        <span className="truncate max-w-[150px]">{p.name}</span>
                                        <span className="font-bold text-red-600">{p.stock} left</span>
                                    </div>
                                )) : <p className="text-text-secondary">No low stock items.</p>}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-text-primary mb-2">Slow-Moving Items ({slowMovingProducts.length})</h4>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {slowMovingProducts.length > 0 ? slowMovingProducts.map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                        <span className="truncate max-w-[150px]">{p.name}</span>
                                        <span className="font-bold text-yellow-600">{p.stock} in stock</span>
                                    </div>
                                )) : <p className="text-text-secondary">No slow-moving items detected.</p>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="space-y-4">
                        <Button onClick={handleGenerateSuggestions} disabled={isLoading}>
                            {isLoading ? 'Analyzing...' : 'Generate Suggestions'}
                        </Button>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Spinner />
                                <p className="ml-4 text-text-secondary">AI is analyzing your inventory...</p>
                            </div>
                        ) : (
                            suggestions.length > 0 ? (
                                <Table headers={["Product", "Stock", "Days Left", "Suggested Reorder"]} scrollable={true} maxHeight="350px">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested Reorder</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suggestions.map(s => (
                                            <tr key={s.productId}>
                                                <td className="px-6 py-2 text-base font-medium truncate max-w-[150px]">{s.productName}</td>
                                                <td className="px-6 py-2 text-base text-center">{s.currentStock}</td>
                                                <td className="px-6 py-2 text-base text-center font-semibold text-red-500">{s.predictedDaysRemaining}</td>
                                                <td className="px-6 py-2 text-base text-center font-bold text-secondary">{s.suggestedReorderQuantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-center text-text-secondary py-16">Click "Generate Suggestions" to get AI-powered reorder recommendations.</p>
                            )
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default InventoryInsights;
