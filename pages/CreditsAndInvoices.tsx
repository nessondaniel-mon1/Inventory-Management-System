import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { Customer } from '../types';

const CreditsAndInvoices: React.FC = () => {
    const { customers, addCustomer, sales, getCustomerName } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'creditBalance'>>({ name: '', type: 'credit', phone: '', email: '' });

    const creditCustomers = customers.filter(c => c.type === 'credit');
    const invoiceCustomers = customers.filter(c => c.type === 'invoice');
    
    const recentCreditsAndInvoices = sales.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'invoice').slice(0, 10);

    const handleAddCustomer = () => {
        if (newCustomer.name && newCustomer.phone) {
            addCustomer(newCustomer);
            setIsModalOpen(false);
            setNewCustomer({ name: '', type: 'credit', phone: '', email: '' });
        }
    };
    
    return (
        <div className="space-y-6">
            <Card title="Credit Customers" action={<Button onClick={() => setIsModalOpen(true)}>Add Customer</Button>}>
                <Table headers={['Name', 'Phone', 'Email', 'Credit Balance']}>
                    {creditCustomers.map(c => (
                        <tr key={c.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{c.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{c.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">${c.creditBalance.toFixed(2)}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Card title="Invoice Customers">
                <Table headers={['Name', 'Phone', 'Email']}>
                    {invoiceCustomers.map(c => (
                        <tr key={c.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{c.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{c.email}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Card title="Recent Credits & Invoices">
                <Table headers={['Date', 'Customer', 'Type', 'Amount']}>
                    {recentCreditsAndInvoices.map(s => (
                        <tr key={s.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(s.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{s.customerId ? getCustomerName(s.customerId) : ''}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">{s.paymentStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${s.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </Table>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer" footer={
                <>
                    <Button onClick={handleAddCustomer}>Add Customer</Button>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                </>
            }>
                <div className="space-y-4">
                    <Input label="Customer Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                    <Input label="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                    <Input label="Email" type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                    <Select label="Customer Type" value={newCustomer.type} onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value as 'credit' | 'invoice' })}>
                        <option value="credit">Credit</option>
                        <option value="invoice">Invoice</option>
                    </Select>
                </div>
            </Modal>
        </div>
    );
};

export default CreditsAndInvoices;