import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    children: React.ReactNode;
    error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, id, children, error, ...props }, ref) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-base font-medium text-text-secondary mb-1">{label}</label>}
            <select
                id={id}
                ref={ref}
                className={`block w-full pl-3 pr-10 py-2 text-base ${error ? 'border-red-500' : 'border-border'} focus:outline-none focus:ring-primary focus:border-primary sm:text-base rounded-md bg-slate-50 text-gray-900`}
                {...props}
            >
                {children}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;