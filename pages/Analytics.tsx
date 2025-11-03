import React from 'react';
import SalesForecastChart from '../components/analytics/SalesForecastChart';
import InventoryInsights from '../components/analytics/InventoryInsights';
import CustomerSegmentation from '../components/analytics/CustomerSegmentation';
import ReportGenerator from '../components/analytics/ReportGenerator';
import FileAnalyzer from '../components/dashboard/FileAnalyzer';

const Analytics: React.FC = () => {
    return (
        <div className="space-y-6">
            <SalesForecastChart />
            <ReportGenerator />
            <FileAnalyzer />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InventoryInsights />
                <CustomerSegmentation />
            </div>
        </div>
    );
};

export default Analytics;