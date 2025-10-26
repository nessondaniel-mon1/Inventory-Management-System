import React from 'react';

interface TableProps {
    headers: string[];
    children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ headers, children }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
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