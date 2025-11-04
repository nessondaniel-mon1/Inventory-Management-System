import React from 'react';
import type { Page } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { useInventory } from '../../hooks/useInventory';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    className?: string;
    isSidebarOpen: boolean; // New prop
    toggleSidebar: () => void; // New prop
}

const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const GemIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="m12 22 4-13-3-6"/><path d="M12 22 8 9l3-6"/></svg>
);


const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, className, isSidebarOpen, toggleSidebar }) => {
    const { currentUser, logout } = useInventory();
    
    const accessibleNavItems = NAV_ITEMS.filter(item => currentUser?.permissions[item.id]);

    return (
        <aside
            className={`
                w-64 bg-sidebar text-white flex-col z-50
                ${isSidebarOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden'}
                lg:flex lg:relative lg:translate-x-0
                transition-transform duration-300 ease-in-out
                ${className}
            `}
        >
            <div className="h-20 flex items-center justify-center border-b border-slate-700">
                <GemIcon className="h-8 w-8 text-indigo-400" />
                <h1 className="text-2xl font-bold ml-2">Inventory Pro</h1>
            </div>
            <nav className="flex-1 px-4 py-6">
                <ul>
                    {accessibleNavItems.map(item => (
                        <li key={item.id} className="mb-2">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(item.id);
                                    if (isSidebarOpen) { // Close sidebar on navigation for small screens
                                        toggleSidebar();
                                    }
                                }}
                                className={`flex items-center p-3 rounded-lg transition-colors ${
                                    currentPage === item.id 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="px-4 py-6 border-t border-slate-700">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        logout();
                        if (isSidebarOpen) { // Close sidebar on logout for small screens
                            toggleSidebar();
                        }
                    }}
                    className="flex items-center p-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <LogOutIcon className="h-5 w-5 mr-3" />
                    <span>Sign Out</span>
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;