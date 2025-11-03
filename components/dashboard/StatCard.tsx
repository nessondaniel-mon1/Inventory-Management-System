import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change, changeType }) => {
    const changeColor = {
        increase: 'text-green-600',
        decrease: 'text-red-600',
        neutral: 'text-text-secondary'
    };
    
    return (
        <Card className="flex items-center p-4">
            <div className={`p-4 rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-base text-text-secondary">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-text-primary">{value}</p>
                    {change && changeType && (
                        <p className={`text-sm font-semibold ${changeColor[changeType]}`}>
                           {change}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default StatCard;