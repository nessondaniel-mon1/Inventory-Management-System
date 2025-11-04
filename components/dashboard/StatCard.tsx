import React, { useState, useEffect } from 'react';
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
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500); // Animation duration
        return () => clearTimeout(timer);
    }, [value]);

    const changeColor = {
        increase: 'text-green-600',
        decrease: 'text-red-600',
        neutral: 'text-text-secondary'
    };
    
    return (
        <Card 
            className={`flex items-center justify-start pl-0 transition-all duration-500 ${isAnimating ? 'bg-yellow-100' : ''}`}
            contentClassName="!p-0"
        >            <div className={`p-1 rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="min-w-0 overflow-hidden flex-1">
                <p className="text-base text-text-secondary truncate" title={title}>{title}</p>
                <div className="flex items-baseline space-x-2 min-w-0">
                    <p 
                        className={`font-bold text-text-primary truncate ${value.length > 12 ? 'text-xl' : 'text-2xl'}`}
                        title={value}
                    >
                        {value}
                    </p>
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