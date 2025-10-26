import React from 'react';
import type { Page } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { useInventory } from '../../hooks/useInventory';

interface HeaderProps {
    currentPage: Page;
}

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
    const { employees } = useInventory();
    const adminUser = employees.find(e => e.role === 'admin');
    const pageTitle = NAV_ITEMS.find(item => item.id === currentPage)?.label || 'Dashboard';

    return (
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6">
            <h1 className="text-3xl font-bold text-text-primary">{pageTitle}</h1>
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 w-64 border border-border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button className="relative text-gray-500 hover:text-primary">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
                </button>
                <div className="flex items-center space-x-3">
                    <img src={`https://i.pravatar.cc/150?u=${adminUser?.id}`} alt="User Avatar" className="h-10 w-10 rounded-full" />
                    <div>
                        <p className="font-semibold text-text-primary">{adminUser?.name}</p>
                        <p className="text-sm text-text-secondary">{adminUser?.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;