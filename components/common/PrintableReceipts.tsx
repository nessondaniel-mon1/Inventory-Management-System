import React from 'react';
import type { Sale, ReceiptSettings, SaleItem, Payment, Bill, Customer } from '../../types';

interface PrintableReceiptProps {
    sale: Sale;
    getProductName: (id: string) => string;
    getCustomerName: (id: string) => string;
    getEmployeeName: (id: string) => string;
    receiptSettings: ReceiptSettings;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, getProductName, getCustomerName, getEmployeeName, receiptSettings }) => {
    const subtotal = sale.items.reduce((acc, item) => acc + item.quantity * item.salePrice, 0);

    const calculateItemDiscountAmount = (item: SaleItem) => {
        if (!item.discount || item.discount.value <= 0) return 0;
        const itemTotal = item.salePrice * item.quantity;
        if (item.discount.type === 'fixed') {
            return Math.min(item.discount.value, itemTotal);
        } else {
            return itemTotal * (item.discount.value / 100);
        }
    };

    const totalItemDiscounts = sale.items.reduce((acc, item) => acc + calculateItemDiscountAmount(item), 0);
    const totalBeforeTax = sale.total - (sale.tax?.amount || 0);
    const totalAfterItemDiscounts = subtotal - totalItemDiscounts;
    const totalCartDiscount = totalAfterItemDiscounts - totalBeforeTax;

    return (
        <div className={`printable-receipt p-2 font-mono text-black bg-white text-${receiptSettings.fontSize || 'xs'}`}>
            <div className="text-center">
                {receiptSettings.logo && <img src={receiptSettings.logo} alt="logo" className="max-h-16 mx-auto mb-2" />}
                <h2 className="text-base font-bold">INVENTORY PRO</h2>
                <p className="text-[10px]">123 Business Rd, Commerce City, 12345</p>
                <p className="text-[10px]">Tel: (123) 456-7890</p>
                <hr className="my-1 border-dashed border-black" />
            </div>
            <div className="text-[10px] space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Receipt:</span>
                    <span className="text-right truncate">{sale.receiptNumber}</span>
                </div>
                {sale.paymentStatus === 'invoice' && sale.invoiceDetails?.invoiceNumber && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Invoice:</span>
                        <span className="text-right truncate">{sale.invoiceDetails.invoiceNumber}</span>
                    </div>
                )}
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Date:</span>
                    <span className="text-right truncate">{new Date(sale.date).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Cashier:</span>
                    <span className="text-right truncate">{getEmployeeName(sale.employeeId)}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Customer:</span>
                    <span className="text-right truncate">{sale.customerId ? getCustomerName(sale.customerId) : 'Walk-in'}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            
            <div className="my-1">
                {sale.items.map(item => (
                    <div key={item.productId} className="py-0.5 border-b border-dashed border-black last:border-b-0">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center">
                            <span className="truncate" title={getProductName(item.productId)}>
                                {getProductName(item.productId)}
                            </span>
                            <span className="text-center">{item.quantity}x</span>
                            <span className="text-right">@${item.salePrice.toFixed(2)}</span>
                            <span className="text-right font-semibold">${(item.quantity * item.salePrice).toFixed(2)}</span>
                        </div>
                        {item.discount && item.discount.value > 0 && (
                            <div className="pl-4 text-gray-600 text-[9px] grid grid-cols-[1fr_auto]">
                                <span>Discount ({item.discount.type === 'fixed' ? `$${item.discount.value.toFixed(2)}` : `${item.discount.value}%`})</span>
                                <span className="text-right">-${(calculateItemDiscountAmount(item)).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <hr className="my-1 border-dashed border-black" />
            <div className="text-xs space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Subtotal:</span>
                    <span className="text-right">${subtotal.toFixed(2)}</span>
                </div>
                 {totalItemDiscounts > 0.001 && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Item Discounts:</span>
                        <span className="text-right">-${totalItemDiscounts.toFixed(2)}</span>
                    </div>
                )}
                 {totalCartDiscount > 0.001 && (
                    <div className="grid grid-cols-2 gap-x-2">
                        <span>Order Discount:</span>
                        <span className="text-right">-${totalCartDiscount.toFixed(2)}</span>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Tax ({sale.tax ? (sale.tax.type === 'fixed' ? 'Fixed' : `${sale.tax.value}%`) : '0%'}):</span>
                    <span className="text-right">${(sale.tax?.amount || 0).toFixed(2)}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2 font-bold text-base mt-1">
                    <span>TOTAL:</span>
                    <span className="text-right">${sale.total.toFixed(2)}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="text-[10px]">
                <p className="font-semibold text-center uppercase">Payment Details</p>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Method:</span>
                    <span className="capitalize text-right">{sale.paymentMethod}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Status:</span>
                    <span className="capitalize font-semibold text-right">{sale.paymentStatus}</span>
                </div>
                {sale.paymentStatus === 'credit' && (
                    <div className="grid grid-cols-2 gap-x-2 mt-1 pt-1 border-t border-dashed border-black font-bold">
                        <span>CHARGED TO ACCOUNT:</span>
                        <span className="text-right">${sale.total.toFixed(2)}</span>
                    </div>
                )}
                {sale.paymentStatus === 'invoice' && (
                    <div className="grid grid-cols-2 gap-x-2 mt-1 pt-1 border-t border-dashed border-black font-bold">
                        <span>AMOUNT DUE:</span>
                        <span className="text-right">${sale.total.toFixed(2)}</span>
                    </div>
                )}
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="text-center text-[9px] mt-1 text-gray-500">
                <p>Internal Data:</p>
                <p>COGS: ${sale.totalCost.toFixed(2)} | Profit: ${sale.profit.toFixed(2)}</p>
            </div>
            <p className="text-center text-[10px] mt-1">{receiptSettings.footerText || 'Thank you for your business!'}</p>
        </div>
    )
};

interface PrintablePaymentReceiptProps {
    payment: Payment;
    customer: Customer;
    receiptSettings: ReceiptSettings;
}

export const PrintablePaymentReceipt: React.FC<PrintablePaymentReceiptProps> = ({ payment, customer, receiptSettings }) => {
    const previousBalance = (payment.balanceAfterPayment ?? 0) + payment.amount;

    return (
        <div className={`printable-receipt p-2 font-mono text-black bg-white text-${receiptSettings.fontSize || 'xs'}`}>
            <div className="text-center">
                {receiptSettings.logo && <img src={receiptSettings.logo} alt="logo" className="max-h-16 mx-auto mb-2" />}
                <h2 className="text-base font-bold">INVENTORY PRO</h2>
                <p className="text-[10px]">123 Business Rd, Commerce City, 12345</p>
                <p className="text-[10px]">Tel: (123) 456-7890</p>
                <hr className="my-1 border-dashed border-black" />
                <h3 className="text-sm font-bold">PAYMENT RECEIPT</h3>
            </div>
            <div className="text-[10px] space-y-0.5 mt-2">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Payment ID:</span>
                    <span className="text-right truncate">{payment.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Date:</span>
                    <span className="text-right truncate">{new Date(payment.date).toLocaleString()}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Customer:</span>
                    <span className="text-right truncate">{customer.name}</span>
                </div>
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Account Type:</span>
                    <span className="capitalize text-right">{customer.type}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="text-xs space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Previous Balance:</span>
                    <span className="text-right">${previousBalance.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 font-bold text-base mt-1">
                    <span>AMOUNT PAID:</span>
                    <span className="text-right">${payment.amount.toFixed(2)}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
             <div className="grid grid-cols-2 gap-x-2 font-bold text-base">
                <span>Remaining Balance:</span>
                <span className="text-right">${payment.balanceAfterPayment?.toFixed(2)}</span>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="text-[10px] space-y-0.5">
                 <div className="grid grid-cols-2 gap-x-2">
                    <span>Method:</span>
                    <span className="text-right">Payment on Account</span>
                </div>
            </div>
            <p className="text-center text-[10px] mt-2">{receiptSettings.footerText || 'Thank you for your payment!'}</p>
        </div>
    );
};

interface PrintableBillReceiptProps {
    bill: Bill & { paidDate: Date; employeeId?: string; };
    getEmployeeName: (id: string) => string;
    receiptSettings: ReceiptSettings;
}

export const PrintableBillReceipt: React.FC<PrintableBillReceiptProps> = ({ bill, getEmployeeName, receiptSettings }) => {
    return (
        <div className={`printable-receipt p-2 font-mono text-black bg-white text-${receiptSettings.fontSize || 'xs'}`}>
            <div className="text-center">
                {receiptSettings.logo && <img src={receiptSettings.logo} alt="logo" className="max-h-16 mx-auto mb-2" />}
                <h2 className="text-base font-bold">INVENTORY PRO</h2>
                <hr className="my-1 border-dashed border-black" />
                <h3 className="text-sm font-bold uppercase">Paid Bill Receipt</h3>
            </div>
            <div className="text-[10px] space-y-0.5 mt-2">
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Date Paid:</span>
                    <span className="text-right truncate">{new Date(bill.paidDate).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Vendor:</span>
                    <span className="text-right truncate">{bill.vendor}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Paid By:</span>
                    <span className="text-right truncate">{bill.employeeId ? getEmployeeName(bill.employeeId) : 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <span>Category:</span>
                    <span className="text-right truncate">{bill.category}</span>
                </div>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="my-1 text-xs">
                <p className="font-semibold text-[10px]">DESCRIPTION:</p>
                <p>{bill.description}</p>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <div className="grid grid-cols-2 gap-x-2 font-bold text-base mt-2">
                <span>AMOUNT PAID:</span>
                <span className="text-right">${bill.amount.toFixed(2)}</span>
            </div>
            <hr className="my-1 border-dashed border-black" />
            <p className="text-center text-[10px] mt-2">{receiptSettings.footerText || 'Thank you!'}</p>
        </div>
    );
};
