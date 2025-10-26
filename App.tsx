import React, { useState } from 'react';
import { InventoryProvider } from './hooks/useInventory';
import type { Page } from './types';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import CreditsAndInvoices from './pages/CreditsAndInvoices';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import Account from './pages/Account';

// FIX: Removed React.FC to prevent potential issues with implicit children in some TypeScript environments, which can cause misleading errors.
const App = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'sales': return <Sales />;
            case 'accounting': return <Accounting />;
            case 'credits': return <CreditsAndInvoices />;
            case 'products': return <Products />;
            case 'suppliers': return <Suppliers />;
            case 'analytics': return <Analytics />;
            case 'account': return <Account />;
            default: return <Dashboard />;
        }
    };

    return (
        <InventoryProvider>
            <div className="flex h-screen bg-background text-text-primary">
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header currentPage={currentPage} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </InventoryProvider>
    );
};

export default App;
