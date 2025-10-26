import React, { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import type { Product } from '../types';

const Products: React.FC = () => {
    const { products, suppliers, addProduct, updateProductStock, stockUpdates, getProductName } = useInventory();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [stockChange, setStockChange] = useState(0);
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt' | 'stock'>>({ name: '', price: 0, supplierId: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const handleAddProduct = () => {
        if (newProduct.name && newProduct.price > 0 && newProduct.supplierId) {
            addProduct({ ...newProduct, stock: 0 });
            setIsAddModalOpen(false);
            setNewProduct({ name: '', price: 0, supplierId: '' });
        }
    };

    const handleUpdateStock = () => {
        if (selectedProduct && stockChange !== 0) {
            updateProductStock(selectedProduct.id, stockChange, 'correction');
            setIsStockModalOpen(false);
            setSelectedProduct(null);
            setStockChange(0);
        }
    };

    const openStockModal = (product: Product) => {
        setSelectedProduct(product);
        setIsStockModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            <Card title="Product List" action={<Button onClick={() => setIsAddModalOpen(true)}>Add Product</Button>}>
                <div className="mb-4">
                    <Input placeholder="Search for a product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Table headers={['Name', 'Price', 'Stock', 'Supplier', 'Actions']}>
                    {filteredProducts.map(p => (
                        <tr key={p.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{p.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${p.price.toFixed(2)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${p.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>{p.stock}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{suppliers.find(s => s.id === p.supplierId)?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button size="sm" variant="ghost" onClick={() => openStockModal(p)}>Update Stock</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Card title="Recent Stock Updates">
                <Table headers={['Date', 'Product', 'Reason', 'Change', 'New Stock']}>
                    {stockUpdates.slice(0, 10).map(update => (
                        <tr key={update.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(update.date).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{getProductName(update.productId)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">{update.reason.replace('_', ' ')}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${update.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {update.quantityChange > 0 ? `+${update.quantityChange}` : update.quantityChange}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{update.newStock}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

            {/* Add Product Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Product" footer={
                <><Button onClick={handleAddProduct}>Save Product</Button><Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button></>
            }>
                <div className="space-y-4">
                    <Input label="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                    <Input label="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} />
                    <Select label="Supplier" value={newProduct.supplierId} onChange={e => setNewProduct({ ...newProduct, supplierId: e.target.value })}>
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
            </Modal>

            {/* Update Stock Modal */}
            <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title={`Update stock for ${selectedProduct?.name}`} footer={
                <><Button onClick={handleUpdateStock}>Update Stock</Button><Button variant="ghost" onClick={() => setIsStockModalOpen(false)}>Cancel</Button></>
            }>
                <p>Current stock: <span className="font-bold">{selectedProduct?.stock}</span></p>
                <Input label="Stock Change (use negative for decrease)" type="number" value={stockChange} onChange={e => setStockChange(parseInt(e.target.value, 10) || 0)} />
            </Modal>
        </div>
    );
};

export default Products;