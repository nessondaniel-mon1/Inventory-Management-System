import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
    return (
        <Card className="flex items-center">
            <div className={`p-4 rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm text-text-secondary">{title}</p>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
        </Card>
    );
};

export default StatCard;