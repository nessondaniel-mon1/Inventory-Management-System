import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, icon, id, error, ...props }, ref) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-base font-medium text-text-secondary mb-1">{label}</label>}
            <div className="relative">
                {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
                <input
                    id={id}
                    ref={ref}
                    className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-border'} rounded-md shadow-sm bg-slate-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-base ${icon ? 'pl-10' : ''}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;