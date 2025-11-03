import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './hooks/useInventory';
import type { Page } from './types';
import { NAV_ITEMS } from './constants';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import CreditsAndInvoices from './pages/CreditsAndInvoices';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import Account from './pages/Account';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Spinner from './components/ui/Spinner';

const AppContent: React.FC = () => {
    const { currentUser, isLoadingAuth, checkInitialSetup } = useInventory();
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [needsSetup, setNeedsSetup] = useState(false);
    
    useEffect(() => {
        // This check runs only when the auth state is resolved and there's no user.
        if (!isLoadingAuth && !currentUser) {
            const initializeApp = async () => {
                const isSetupNeeded = await checkInitialSetup();
                setNeedsSetup(isSetupNeeded);
            };
            initializeApp();
        }
        // If there is a user, we know setup is not needed.
        if(currentUser) {
            setNeedsSetup(false);
        }
    }, [isLoadingAuth, currentUser, checkInitialSetup]);

    // The main loading logic now only depends on the auth state loading.
    if (isLoadingAuth) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Spinner size="lg" />
            </div>
        );
    }
    
    // If setup is needed (and auth is loaded, and no user), render the SignUp page.
    if (needsSetup) {
        return <SignUpPage />;
    }

    // If no user is logged in (and setup is complete), show the login page.
    if (!currentUser) {
        return <LoginPage />;
    }
    
    // Redirect logic: if user lacks permission for the current page, find the first accessible page and switch to it.
    if (!currentUser.permissions[currentPage]) {
        const fallbackPage = NAV_ITEMS.find(item => currentUser.permissions[item.id])?.id || 'dashboard';
        setCurrentPage(fallbackPage);
        // This will cause a re-render, so the content below will be for the correct page.
    }

    const renderPage = () => {
        // Double-check permission before rendering. Should be handled by redirect logic above, but this is a safeguard.
        if (!currentUser.permissions[currentPage]) {
            return <Dashboard setCurrentPage={setCurrentPage} />;
        }

        switch (currentPage) {
            case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
            case 'sales': return <Sales />;
            case 'accounting': return <Accounting />;
            case 'credits': return <CreditsAndInvoices />;
            case 'payments': return <Payments />;
            case 'products': return <Products />;
            case 'suppliers': return <Suppliers />;
            case 'analytics': return <Analytics />;
            case 'account': return <Account />;
            default: return <Dashboard setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className="flex h-screen bg-background text-text-primary">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <InventoryProvider>
            <AppContent />
        </InventoryProvider>
    );
};

export default App;
