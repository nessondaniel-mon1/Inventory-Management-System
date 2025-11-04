import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    contentClassName?: string; // New prop
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, contentClassName = '' }) => {
    return (
        <div className={`bg-card rounded-lg shadow-md border border-border ${className}`}>
            {(title || action) && (
                 <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={`p-6 ${contentClassName}`}> {/* Apply contentClassName here */}
                {children}
            </div>
        </div>
    );
};

export default Card;