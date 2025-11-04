import React, { Fragment, useEffect } from 'react';

interface ModalProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    contentClassName?: string; // New prop
}

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = '2xl', scrollable = false }) => {
    console.log('Modal rendered, isOpen:', isOpen);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = ''; // Reset to default
        }

        // Cleanup function to ensure overflow is reset when component unmounts or isOpen changes
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]); // Re-run effect when isOpen changes

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };

    const contentClasses = scrollable ? "p-6 space-y-6 max-h-[70vh] overflow-y-auto" : "p-6 space-y-6";

    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className={`relative bg-card rounded-lg shadow-xl w-full mx-auto transform transition-all ${sizeClasses[size]}`}>
                <div className="flex items-start justify-between p-5 border-b border-border rounded-t">
                    <h3 className="text-xl font-semibold text-text-primary" id="modal-title">
                        {title}
                    </h3>
                    <button type="button" className="text-gray-400 bg-transparent hover:bg-yellow-100 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" onClick={onClose}>
                        <CloseIcon className="w-5 h-5" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                <div className={contentClasses}>
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center p-6 space-x-2 border-t border-border rounded-b">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;