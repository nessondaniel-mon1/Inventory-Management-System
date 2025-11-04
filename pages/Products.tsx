import React, { useState, useMemo, useRef, KeyboardEvent } from 'react';
import { useInventory } from '../hooks/useInventory';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import type { Product, StockUpdate } from '../types';

const Products: React.FC = () => {
    const { products, suppliers, addProduct, stockUpdates, getProductName, updateProductPrice, getSupplierName, getPurchaseCost } = useInventory();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [newPrice, setNewPrice] = useState(0);
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt'>>({ name: '', price: 0, stock: 0, supplierId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [formErrors, setFormErrors] = useState<{ name?: string; price?: string; stock?: string; supplierId?: string }>({});

    const nameInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const supplierSelectRef = useRef<HTMLSelectElement>(null);
    
    const [searchDay, setSearchDay] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [dateSearchError, setDateSearchError] = useState('');

    const [sortOrder, setSortOrder] = useState<'recent' | 'a-z' | 'z-a' | 'stock-low' | 'stock-high'>('recent');

    const filteredProducts = useMemo(() => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        switch (sortOrder) {
            case 'a-z':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'z-a':
                return filtered.sort((a, b) => b.name.localeCompare(a.name));
            case 'stock-low':
                return filtered.sort((a, b) => a.stock - b.stock);
            case 'stock-high':
                return filtered.sort((a, b) => b.stock - a.stock);
            case 'recent':
            default:
                return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }, [products, searchTerm, sortOrder]);
    
    const recentStockAdditions = useMemo(() => {
        const hasSearch = searchDay || searchMonth || searchYear;
        
        const additions = stockUpdates
            .filter(update => update.quantityChange > 0)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (hasSearch) {
            return additions.filter(update => {
                const updateDate = new Date(update.date);
                const day = String(updateDate.getDate());
                const month = String(updateDate.getMonth() + 1);
                const year = String(updateDate.getFullYear());
                const dayMatch = !searchDay || day.startsWith(day);
                const monthMatch = !searchMonth || month.startsWith(month);
                const yearMatch = !searchYear || year.startsWith(year);
                return dayMatch && monthMatch && yearMatch;
            });
        }
        
        return additions.slice(0, 10);
    }, [stockUpdates, searchDay, searchMonth, searchYear]);

    const productStockHistory = useMemo(() => {
        if (!selectedProduct) return [];
        return stockUpdates
            .filter(update => update.productId === selectedProduct.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockUpdates, selectedProduct]);

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewProduct({ name: '', price: 0, stock: 0, supplierId: '' });
        setFormErrors({});
    };

    const handleAddProduct = () => {
        const errors: { name?: string; price?: string; stock?: string; supplierId?: string } = {};
        
        if (!newProduct.name.trim()) errors.name = "Product name is required.";
        if (newProduct.price <= 0) errors.price = "Price must be greater than 0.";
        if (newProduct.stock < 0) errors.stock = "Stock cannot be negative.";
        if (!newProduct.supplierId) errors.supplierId = "Please select a supplier.";
        
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            addProduct(newProduct);
            closeAddModal();
        }
    };

    const handleUpdatePrice = () => {
        if (selectedProduct && newPrice > 0) {
            updateProductPrice(selectedProduct.id, newPrice);
            setIsPriceModalOpen(false);
            setSelectedProduct(null);
            setNewPrice(0);
        }
    };

    const openPriceModal = (product: Product) => {
        setSelectedProduct(product);
        setNewPrice(product.price);
        setIsPriceModalOpen(true);
    };

    const openHistoryModal = (product: Product) => {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, nextFieldRef?: React.RefObject<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldRef?.current) {
                nextFieldRef.current.focus();
            } else {
                handleAddProduct();
            }
        }
    };
    
    const handleDateSearchChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (/^\d*$/.test(value)) {
            setter(value);
            setDateSearchError('');
        } else {
            setDateSearchError('Please enter only numbers for the date.');
        }
    };
    
    const formatReason = (reason: StockUpdate['reason']) => {
        switch (reason) {
            case 'sale': return 'Sale';
            case 'new_supply': return 'New Supply';
            case 'correction': return 'Correction';
            case 'return': return 'Return';
            default: return reason;
        }
    };

    return (
        <div className="space-y-6">
            <Card 
                title="Product List" 
                action={
                    <div className="flex items-center gap-4">
                        <Select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'recent' | 'a-z' | 'z-a' | 'stock-low' | 'stock-high')}>
                            <option value="recent">Recent</option>
                            <option value="a-z">A-Z</option>
                            <option value="z-a">Z-A</option>
                            <option value="stock-low">Stock (Low to High)</option>
                            <option value="stock-high">Stock (High to Low)</option>
                        </Select>
                        <Button onClick={() => setIsAddModalOpen(true)}>Add Product</Button>
                    </div>
                }
            >
                <div className="mb-4">
                    <Input placeholder="Search for a product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="max-h-[540px] overflow-y-auto">
                    <Table headers={[
                        { label: 'Name', className: 'min-w-[150px]' },
                        { label: 'Price', className: 'min-w-[80px] text-right' },
                        { label: 'Profit Margin', className: 'min-w-[100px] text-right' },
                        { label: 'Stock', className: 'min-w-[80px] text-right' },
                        { label: 'Supplier', className: 'min-w-[150px]' },
                        { label: 'Actions', className: 'min-w-[180px] text-right' }
                    ]}>
                        {filteredProducts.map(p => {
                            const supplierName = getSupplierName(p.supplierId);
                            const cost = getPurchaseCost(p.id);
                            const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
                            return (
                                <tr key={p.id} className="hover:bg-yellow-100">
                                    <td className="px-6 py-2 text-base font-medium text-text-primary truncate" title={p.name}>{p.name}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary text-right">${p.price.toFixed(2)}</td>
                                    <td className={`px-6 py-2 whitespace-nowrap text-base font-semibold text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {margin.toFixed(1)}%
                                    </td>
                                    <td className={`px-6 py-2 whitespace-nowrap text-base font-bold text-right ${p.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>{p.stock}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary truncate" title={supplierName}>
                                        {supplierName}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-right space-x-2">
                                        <Button size="sm" variant="ghost" onClick={() => openHistoryModal(p)}>History</Button>
                                        <Button size="sm" variant="ghost" onClick={() => openPriceModal(p)}>Update Price</Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
                </div>
            </Card>

            <Card title="Recent Stock Updates">
                <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <p className="font-medium text-text-secondary flex-shrink-0">Search by date:</p>
                        <div className="grid grid-cols-3 gap-2 flex-grow">
                            <Input
                                placeholder="DD"
                                value={searchDay}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchDay)}
                                maxLength={2}
                                className="bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="MM"
                                value={searchMonth}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchMonth)}
                                maxLength={2}
                                className="bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="YYYY"
                                value={searchYear}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchYear)}
                                maxLength={4}
                                className="bg-gray-100 text-black border-primary"
                            />
                        </div>
                    </div>
                    {dateSearchError && <p className="text-red-500 text-sm mt-2">{dateSearchError}</p>}
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                    <Table headers={[
                        { label: 'Date', className: 'min-w-[150px]' },
                        { label: 'Product', className: 'min-w-[150px]' },
                        { label: 'Supplier', className: 'min-w-[150px]' },
                        { label: 'Old Stock', className: 'min-w-[100px] text-right' },
                        { label: 'Added', className: 'min-w-[100px] text-right' },
                        { label: 'New Stock', className: 'min-w-[100px] text-right' }
                    ]}>
                        {recentStockAdditions.map(update => {
                            const product = products.find(p => p.id === update.productId);
                            const supplierName = product ? getSupplierName(product.supplierId) : 'N/A';
                            
                            return (
                                <tr key={update.id} className="hover:bg-yellow-100">
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(update.date).toLocaleString()}</td>
                                    <td className="px-6 py-2 text-base font-medium text-text-primary truncate" title={getProductName(update.productId)}>
                                        {getProductName(update.productId)}
                                    </td>
                                    <td className="px-6 py-2 text-base text-text-secondary truncate" title={supplierName}>{supplierName}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary text-right">{update.previousStock}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-green-600 text-right">+{update.quantityChange}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base font-bold text-text-primary text-right">{update.newStock}</td>
                                </tr>
                            );
                        })}
                    </Table>
                </div>
            </Card>

            {/* Add Product Modal */}
            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add New Product" footer={
                <><Button onClick={handleAddProduct}>Save Product</Button><Button variant="ghost" onClick={closeAddModal}>Cancel</Button></>
            }>
                <div className="space-y-4">
                    <Input 
                        ref={nameInputRef}
                        label="Product Name" 
                        value={newProduct.name} 
                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                        onKeyDown={e => handleKeyDown(e, priceInputRef)}
                        error={formErrors.name}
                    />
                    <Input 
                        ref={priceInputRef}
                        label="Price" 
                        type="number" 
                        value={newProduct.price} 
                        onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} 
                        onKeyDown={e => handleKeyDown(e, quantityInputRef)}
                        error={formErrors.price}
                    />
                    <Input 
                        ref={quantityInputRef}
                        label="Initial Stock Quantity" 
                        type="number" 
                        value={newProduct.stock} 
                        onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value, 10) || 0 })}
                        onKeyDown={e => handleKeyDown(e, supplierSelectRef)}
                        error={formErrors.stock}
                    />
                    <Select 
                        ref={supplierSelectRef}
                        label="Supplier" 
                        value={newProduct.supplierId} 
                        onChange={e => setNewProduct({ ...newProduct, supplierId: e.target.value })}
                        onKeyDown={e => handleKeyDown(e)}
                        error={formErrors.supplierId}
                    >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
            </Modal>

            {/* Update Price Modal */}
            <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title={`Update price for ${selectedProduct?.name}`} footer={
                <><Button onClick={handleUpdatePrice}>Update Price</Button><Button variant="ghost" onClick={() => setIsPriceModalOpen(false)}>Cancel</Button></>
            }>
                <p>Current price: <span className="font-bold">${selectedProduct?.price.toFixed(2)}</span></p>
                <Input label="New Price" type="number" value={newPrice} onChange={e => setNewPrice(parseFloat(e.target.value) || 0)} />
            </Modal>
            
            {/* Stock History Modal */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Stock History for ${selectedProduct?.name}`} size="4xl" footer={
                <Button variant="ghost" onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
            }>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table headers={['Date', 'Reason', 'Change', 'Old Stock', 'New Stock']}>
                        {productStockHistory.map(update => (
                            <tr key={update.id}>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{new Date(update.date).toLocaleString()}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{formatReason(update.reason)}</td>
                                <td className={`px-6 py-2 whitespace-nowrap text-base font-bold ${update.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {update.quantityChange > 0 ? `+${update.quantityChange}` : update.quantityChange}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{update.previousStock}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base font-semibold text-text-primary">{update.newStock}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
            </Modal>
        </div>
    );
};

export default Products;