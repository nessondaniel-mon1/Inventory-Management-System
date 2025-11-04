import React from 'react';

interface TableHeader {
    label: string;
    className?: string;
}

interface TableProps {
    headers: (string | TableHeader)[];
    children: React.ReactNode;
    scrollable?: boolean; // New prop
    maxHeight?: string; // New prop for max-height
}

const Table: React.FC<TableProps> = ({ headers, children, scrollable = false, maxHeight = '75vh' }) => {
    const scrollClasses = scrollable ? `overflow-y-auto` : '';
    const heightClass = scrollable ? `max-h-[${maxHeight}]` : '';

    return (
        <div className={`overflow-x-auto ${scrollClasses} ${heightClass}`}>
            <table className="min-w-full divide-y divide-border table-fixed w-full">
                <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr>
                        {headers.map((header, index) => {
                            // FIX: The previous logic was causing a TypeScript type inference issue.
                            // This has been simplified using a direct type check to correctly extract `label` and `className`.
                            const label = typeof header === 'string' ? header : header.label;
                            const customClassName = typeof header === 'string' ? '' : (header.className || '');
                            
                            return (
                                <th
                                    key={index}
                                    scope="col"
                                    className={`px-6 py-2 text-left text-sm font-medium text-text-secondary uppercase tracking-wider ${customClassName}`}
                                >
                                    {label}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export default Table;