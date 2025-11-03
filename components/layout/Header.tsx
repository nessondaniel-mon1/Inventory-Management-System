import React, { useState, useEffect, useRef } from 'react';
import type { Page, Product, Customer, Supplier, Sale, Bill, Employee as User } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { useInventory } from '../../hooks/useInventory';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

// Icons
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0"/><path d="M12 12.9a7.5 7.5 0 0 1 7.4-6 4.5 4.5 0 1 1-2.5 8.2"/><path d="M12 12.9a7.5 7.5 0 0 0-7.4-6 4.5 4.5 0 1 0 2.5 8.2"/><path d="M12 12.9v10.1"/><path d="M12 18.5a2.5 2.5 0 0 1-2.5-2.5h5a2.5 2.5 0 0 1-2.5 2.5Z"/></svg>;
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const TruckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 17.5 17.5 14"/><path d="M22 17.5 17.5 21"/><path d="M10 5H8.3C7.5 5 7 5.5 7 6.3V17"/><path d="M14 5h2.7c.8 0 1.3.5 1.3 1.3V17"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const ReceiptIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h6"/><path d="M12 17V7"/></svg>;
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const CompassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
    const { currentUser, users, products, customers, suppliers, sales, bills, getCustomerName } = useInventory();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        products: Product[],
        customers: Customer[],
        suppliers: Supplier[],
        sales: Sale[],
        bills: Bill[],
        users: User[],
        pages: typeof NAV_ITEMS,
    }>({ products: [], customers: [], suppliers: [], sales: [], bills: [], users: [], pages: [] });
    const [isResultsVisible, setIsResultsVisible] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    // Date & Time state
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentDateTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = currentDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const lowerQuery = searchQuery.toLowerCase();
            const filteredProducts = products.filter(p => p.name.toLowerCase().includes(lowerQuery)).slice(0, 3);
            const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(lowerQuery)).slice(0, 3);
            const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(lowerQuery)).slice(0, 3);
            const filteredSales = sales.filter(s =>
                s.receiptNumber.toLowerCase().includes(lowerQuery) ||
                (s.invoiceDetails?.invoiceNumber?.toLowerCase().includes(lowerQuery)) ||
                (s.customerId && getCustomerName(s.customerId).toLowerCase().includes(lowerQuery))
            ).slice(0, 3);
            const filteredBills = bills.filter(b =>
                b.vendor.toLowerCase().includes(lowerQuery) ||
                b.description.toLowerCase().includes(lowerQuery)
            ).slice(0, 3);
            const filteredUsers = users.filter(e => e.name.toLowerCase().includes(lowerQuery)).slice(0, 3);
            const filteredPages = NAV_ITEMS.filter(p => p.label.toLowerCase().includes(lowerQuery)).slice(0, 3);

            setSearchResults({
                products: filteredProducts,
                customers: filteredCustomers,
                suppliers: filteredSuppliers,
                sales: filteredSales,
                bills: filteredBills,
                users: filteredUsers,
                pages: filteredPages,
             });
            setIsResultsVisible(true);
        } else {
            setIsResultsVisible(false);
            setSearchResults({ products: [], customers: [], suppliers: [], sales: [], bills: [], users: [], pages: [] });
        }
    }, [searchQuery, products, customers, suppliers, sales, bills, getCustomerName, users]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsResultsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (page: Page) => {
        setCurrentPage(page);
        setSearchQuery('');
        setIsResultsVisible(false);
    };

    let pageTitle = NAV_ITEMS.find(item => item.id === currentPage)?.label || 'Dashboard';
    if (currentPage === 'accounting') {
        pageTitle = 'SALES JOURNAL ENTRY';
    }

    const hasResults = searchResults.products.length > 0 || searchResults.customers.length > 0 || searchResults.suppliers.length > 0 || searchResults.sales.length > 0 || searchResults.bills.length > 0 || searchResults.users.length > 0 || searchResults.pages.length > 0;

    return (
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6">
            <h1 className="text-3xl font-bold text-text-primary">{pageTitle}</h1>
            <div className="flex items-center space-x-4">
                <div ref={searchContainerRef} className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search everything (products, customers, users...)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchQuery.trim().length > 1) setIsResultsVisible(true); }}
                        className="pl-10 pr-4 py-2.5 w-[500px] border border-border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {isResultsVisible && (
                        <div className="absolute top-full mt-2 w-[500px] bg-card border border-border rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
                            {hasResults ? (
                                <>
                                    {searchResults.products.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-b">Products</h4>
                                            <ul>{searchResults.products.map(p => <li key={p.id} onClick={() => handleResultClick('products')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><PackageIcon className="w-5 h-5 text-gray-400"/> {p.name}</li>)}</ul>
                                        </div>
                                    )}
                                    {searchResults.customers.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t border-b">Customers</h4>
                                            <ul>{searchResults.customers.map(c => <li key={c.id} onClick={() => handleResultClick('credits')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><UserIcon className="w-5 h-5 text-gray-400"/> {c.name}</li>)}</ul>
                                        </div>
                                    )}
                                     {searchResults.users.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t border-b">Users</h4>
                                            <ul>{searchResults.users.map(e => <li key={e.id} onClick={() => handleResultClick('account')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><UserIcon className="w-5 h-5 text-gray-400"/> {e.name}</li>)}</ul>
                                        </div>
                                    )}
                                    {searchResults.suppliers.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t border-b">Suppliers</h4>
                                            <ul>{searchResults.suppliers.map(s => <li key={s.id} onClick={() => handleResultClick('suppliers')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><TruckIcon className="w-5 h-5 text-gray-400"/> {s.name}</li>)}</ul>
                                        </div>
                                    )}
                                    {searchResults.sales.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t border-b">Sales</h4>
                                            <ul>{searchResults.sales.map(s => <li key={s.id} onClick={() => handleResultClick('sales')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><ReceiptIcon className="w-5 h-5 text-gray-400"/> Sale {s.receiptNumber}</li>)}</ul>
                                        </div>
                                    )}
                                    {searchResults.bills.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t border-b">Bills</h4>
                                            <ul>{searchResults.bills.map(b => <li key={b.id} onClick={() => handleResultClick('payments')} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><FileTextIcon className="w-5 h-5 text-gray-400"/> {b.vendor} - ${b.amount.toFixed(2)}</li>)}</ul>
                                        </div>
                                    )}
                                     {searchResults.pages.length > 0 && (
                                        <div>
                                            <h4 className="px-3 py-2 text-sm font-semibold text-text-secondary bg-gray-50 border-t">Pages & Navigation</h4>
                                            <ul>{searchResults.pages.map(p => <li key={p.id} onClick={() => handleResultClick(p.id)} className="px-3 py-2 hover:bg-yellow-100 cursor-pointer flex items-center gap-3"><CompassIcon className="w-5 h-5 text-gray-400"/> Go to {p.label}</li>)}</ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="p-4 text-center text-text-secondary">No results found for "{searchQuery}".</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-semibold text-text-primary text-sm whitespace-nowrap">{formattedDate}</p>
                    <p className="text-base text-text-secondary whitespace-nowrap">{formattedTime}</p>
                </div>
                <button className="relative text-gray-500 hover:text-primary">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
                </button>
                <div className="flex items-center space-x-3">
                    <img src={`https://i.pravatar.cc/150?u=${currentUser?.id}`} alt="User Avatar" className="h-10 w-10 rounded-full" />
                    <div>
                        <p className="font-semibold text-text-primary">{currentUser?.name}</p>
                        <p className="text-base text-text-secondary capitalize">{currentUser?.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
