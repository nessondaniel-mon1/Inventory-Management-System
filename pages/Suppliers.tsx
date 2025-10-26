import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { Supply } from '../types';

const Suppliers: React.FC = () => {
    const { suppliers, supplies, products, addSupply, getProductName, getSupplierName } = useInventory();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSupply, setNewSupply] = useState<Omit<Supply, 'id' | 'date'>>({ supplierId: '', productId: '', quantity: 0, unitCost: 0 });

    const handleAddSupply = () => {
        if (newSupply.supplierId && newSupply.productId && newSupply.quantity > 0) {
            addSupply(newSupply);
            setIsModalOpen(false);
            setNewSupply({ supplierId: '', productId: '', quantity: 0, unitCost: 0 });
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Supplier List" action={<Button onClick={() => setIsModalOpen(true)}>Add New Supply</Button>}>
                <Table headers={['Name', 'Contact Person', 'Phone', 'Items Supplied']}>
                    {suppliers.map(s => (
                        <tr key={s.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{s.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{s.contactPerson}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{s.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{s.itemsSupplied.join(', ')}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

             <Card title="Recent Supplies">
                <Table headers={['Date', 'Supplier', 'Product', 'Quantity', 'Total Cost']}>
                    {supplies.slice(0, 10).map(s => (
                        <tr key={s.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(s.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{getSupplierName(s.supplierId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getProductName(s.productId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">{s.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">${(s.quantity * s.unitCost).toFixed(2)}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Supply" footer={
                <><Button onClick={handleAddSupply}>Record Supply</Button><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button></>
            }>
                <div className="space-y-4">
                    <Select label="Supplier" value={newSupply.supplierId} onChange={e => setNewSupply({ ...newSupply, supplierId: e.target.value })}>
                        <option value="">Select a supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                     <Select label="Product" value={newSupply.productId} onChange={e => setNewSupply({ ...newSupply, productId: e.target.value })}>
                        <option value="">Select a product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                    <Input label="Quantity" type="number" value={newSupply.quantity} onChange={e => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value, 10) || 0 })} />
                    <Input label="Unit Cost" type="number" value={newSupply.unitCost} onChange={e => setNewSupply({ ...newSupply, unitCost: parseFloat(e.target.value) || 0 })} />
                </div>
            </Modal>
        </div>
    );
};

export default Suppliers;