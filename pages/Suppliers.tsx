

import React, { useState, useMemo, useRef, KeyboardEvent, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useInventory } from '../hooks/useInventory';
import type { Supplier, Supply } from '../types';

interface SupplyItem {
    productId: string;
    quantity: number;
    unitCost: number;
}

interface GroupedSupply {
    id: string;
    date: Date;
    receiptNumber?: string;
    supplierId: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitCost: number;
    }>;
    totalCost: number;
}

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const Suppliers: React.FC = () => {
    const { suppliers, supplies, addSupplier, deleteSupplier, addSupply, getProductName, getSupplierName, products, addProduct, updateSupplier, updateProductSupplier } = useInventory();
    
    // State for Add Supplier Modal
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [itemsSuppliedText, setItemsSuppliedText] = useState('');
    const [formErrors, setFormErrors] = useState<{ name?: string, contactPerson?: string, phone?: string }>({});

    // Refs for keyboard navigation
    const nameInputRef = useRef<HTMLInputElement>(null);
    const contactPersonInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const itemsSuppliedRef = useRef<HTMLTextAreaElement>(null);
    
    // State for Add Supply Modal
    const [isAddSupplyModalOpen, setIsAddSupplyModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
    const [currentProductId, setCurrentProductId] = useState('');
    const [currentQuantity, setCurrentQuantity] = useState<number | string>(1);
    const [currentUnitCost, setCurrentUnitCost] = useState<number | string>('');
    const [supplyReceiptNumber, setSupplyReceiptNumber] = useState('');

    // State for Add Product from Supply Modal
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [newProductForSupplier, setNewProductForSupplier] = useState({ name: '' });

    // State for Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [associatedProductsCount, setAssociatedProductsCount] = useState(0);
    
    // State for supply search
    const [searchDay, setSearchDay] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [dateSearchError, setDateSearchError] = useState('');
    
    // State for sorting suppliers
    const [sortOrder, setSortOrder] = useState<'recent' | 'a-z' | 'z-a'>('recent');
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

    // State for Supplier Edit Modal
    const [editableSupplier, setEditableSupplier] = useState<Supplier | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');

    // State for Unlink Product Confirmation Modal
    const [isUnlinkProductModalOpen, setIsUnlinkProductModalOpen] = useState(false);
    const [productToUnlink, setProductToUnlink] = useState<Product | null>(null);

    // State for toast notifications
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // State for Supply Details Modal
    const [selectedSupplyDetails, setSelectedSupplyDetails] = useState<GroupedSupply | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const sortedSuppliers = useMemo(() => {
        const filtered = suppliers.filter(s => 
            s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
        );
        switch (sortOrder) {
            case 'a-z':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'z-a':
                return filtered.sort((a, b) => b.name.localeCompare(a.name));
            case 'recent':
            default:
                return [...filtered].reverse(); // Newest first
        }
    }, [suppliers, sortOrder, supplierSearchTerm]);


    const supplierProducts = useMemo(() => {
        if (!selectedSupplier) return [];
        return products.filter(p => p.supplierId === selectedSupplier.id);
    }, [products, selectedSupplier]);

    const recentSuppliesRaw = useMemo(() => {
        const hasSearch = searchDay || searchMonth || searchYear;
        
        // Note: `supplies` state is assumed to be sorted by date descending.
        const filtered = supplies.filter(s => {
            const supplyDate = new Date(s.date);
            const day = String(supplyDate.getDate());
            const month = String(supplyDate.getMonth() + 1);
            const year = String(supplyDate.getFullYear());

            const dayMatch = !searchDay || day.startsWith(day);
            const monthMatch = !searchMonth || month.startsWith(month);
            const yearMatch = !searchYear || year.startsWith(year);

            return dayMatch && monthMatch && yearMatch;
        });
        
        return hasSearch ? filtered : supplies.slice(0, 10);
    }, [supplies, searchDay, searchMonth, searchYear]);

    const groupedRecentSupplies = useMemo((): GroupedSupply[] => {
        const grouped: Record<string, GroupedSupply> = {};
    
        recentSuppliesRaw.forEach(supply => {
            // Group by supplier, receipt number, and date rounded to the nearest 5 seconds to catch items added in the same batch
            const dateKey = new Date(Math.round(new Date(supply.date).getTime() / 5000) * 5000).toISOString();
            const key = `${supply.supplierId}-${supply.receiptNumber || ''}-${dateKey}`;
    
            if (!grouped[key]) {
                grouped[key] = {
                    id: supply.id,
                    date: supply.date,
                    receiptNumber: supply.receiptNumber,
                    supplierId: supply.supplierId,
                    items: [],
                    totalCost: 0,
                };
            }
    
            grouped[key].items.push({
                productId: supply.productId,
                quantity: supply.quantity,
                unitCost: supply.unitCost,
            });
            grouped[key].totalCost += supply.quantity * supply.unitCost;
        });
    
        return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [recentSuppliesRaw]);

    const closeAddSupplierModal = () => {
        setIsAddSupplierModalOpen(false);
        setName('');
        setContactPerson('');
        setPhone('');
        setPhoneError('');
        setItemsSuppliedText('');
        setFormErrors({});
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setPhone(value);
        if (value && !/^[0-9-]+$/.test(value)) {
            setPhoneError('Phone number must contain only numbers and hyphens.');
        } else {
            setPhoneError('');
        }
    };

    const handleAddSupplier = async () => {
        const errors: { name?: string, contactPerson?: string, phone?: string } = {};

        if (!name.trim()) errors.name = "Supplier name is required.";
        if (!contactPerson.trim()) errors.contactPerson = "Contact person is required.";
        if (!phone.trim()) errors.phone = "Phone number is required.";
        else if (phoneError) errors.phone = phoneError;
        
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            const items = itemsSuppliedText.split('\n').filter(item => item.trim() !== '');
            const newSupplierRef = await addSupplier({ name, contactPerson, phone, itemsSupplied: items });
            const newSupplierId = newSupplierRef.id;

            // Process itemsSuppliedText to link/create products
            for (const itemName of items) {
                const trimmedItemName = itemName.trim();
                const existingProduct = products.find(p => p.name.toLowerCase() === trimmedItemName.toLowerCase());
                if (existingProduct) {
                    // If product exists and is not already linked to this supplier, link it
                    if (existingProduct.supplierId !== newSupplierId) {
                        await updateProductSupplier(existingProduct.id, newSupplierId);
                    }
                } else {
                    // If product does not exist, create a new one and link it
                    await addProduct({
                        name: trimmedItemName,
                        price: 0, // Default price to 0; can be updated on the Products page
                        stock: 0,
                        supplierId: newSupplierId,
                    });
                }
            }

            // Clear itemsSupplied from the supplier object after products have been processed
            await updateSupplier(newSupplierId, { itemsSupplied: [] });

            setToastMessage({ message: `Supplier ${name} added successfully!`, type: 'success' });
            closeAddSupplierModal();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, nextFieldRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter for new lines in textarea
            e.preventDefault();
            if (nextFieldRef?.current) {
                nextFieldRef.current.focus();
            } else {
                handleAddSupplier();
            }
        }
    };
    
    // --- Delete Supplier Logic ---
    const openDeleteModal = (supplier: Supplier) => {
        const count = products.filter(p => p.supplierId === supplier.id).length;
        setAssociatedProductsCount(count);
        setSelectedSupplier(supplier);
        setIsDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        setSelectedSupplier(null);
        setIsDeleteModalOpen(false);
        setAssociatedProductsCount(0);
    };
    const handleDeleteSupplier = () => {
        if (selectedSupplier) {
            deleteSupplier(selectedSupplier.id);
            closeDeleteModal();
        }
    };

    // --- Add Supply Logic ---
    const openAddSupplyModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsAddSupplyModalOpen(true);
    };
    const closeAddSupplyModal = () => {
        setSelectedSupplier(null);
        setIsAddSupplyModalOpen(false);
        setSupplyItems([]);
        setCurrentProductId('');
        setCurrentQuantity(1);
        setCurrentUnitCost('');
        setSupplyReceiptNumber('');
    };
    
    const handleAddProductToSupply = () => {
        const quantity = Number(currentQuantity);
        const unitCost = Number(currentUnitCost);

        if (!currentProductId) {
            alert("Please select a product.");
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            alert("Please enter a quantity greater than 0.");
            return;
        }
        if (isNaN(unitCost) || unitCost < 0) {
            alert("Please enter a valid unit cost (0 or greater).");
            return;
        }

        setSupplyItems(prev => [...prev, {
            productId: currentProductId,
            quantity: quantity,
            unitCost: unitCost,
        }]);
        
        // Reset fields for next entry
        setCurrentProductId('');
        setCurrentQuantity(1);
        setCurrentUnitCost('');
    };

    const handleRemoveProductFromSupply = (productId: string) => {
        setSupplyItems(prev => prev.filter(item => item.productId !== productId));
    };
    
    const handleSaveSupply = () => {
        if (!selectedSupplier) return;
        if (supplyItems.length === 0) {
            setToastMessage({ message: "Please add at least one item to the supply list before saving.", type: 'error' });
            return;
        }
        
        supplyItems.forEach(item => {
            addSupply({
                supplierId: selectedSupplier.id,
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                receiptNumber: supplyReceiptNumber
            });
        });
        
        setToastMessage({ message: `Supply from ${getSupplierName(selectedSupplier.id)} has been recorded.`, type: 'success' });
        closeAddSupplyModal();
    };

    const handleSaveNewProduct = async () => {
        if (!selectedSupplier || !newProductForSupplier.name.trim()) {
            alert("Please enter a valid product name.");
            return;
        }
        // FIX: The `addProduct` function is async and must be awaited to get the product object instead of a Promise.
        const newlyAddedProduct = await addProduct({
            name: newProductForSupplier.name,
            price: 0, // Default price to 0; can be updated on the Products page
            supplierId: selectedSupplier.id,
            stock: 0 
        });
        
        setCurrentProductId(newlyAddedProduct.id);
        setIsAddProductModalOpen(false);
        setNewProductForSupplier({ name: '' });
    };

    const openEditModal = (supplier: Supplier) => {
        setEditableSupplier(JSON.parse(JSON.stringify(supplier))); // Deep copy to prevent direct mutation
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditableSupplier(null);
        setIsEditModalOpen(false);
    };

    const openUnlinkProductModal = (product: Product) => {
        setProductToUnlink(product);
        setIsUnlinkProductModalOpen(true);
    };

    const closeUnlinkProductModal = () => {
        setProductToUnlink(null);
        setIsUnlinkProductModalOpen(false);
    };

    const handleSaveChanges = () => {
        if (editableSupplier) {
            const { id, itemsSupplied, ...detailsToUpdate } = editableSupplier;
            updateSupplier(id, detailsToUpdate);
            setToastMessage({ message: 'Supplier details updated!', type: 'success' });
            closeEditModal();
        }
    };

    const handleUnlinkProduct = async () => {
        if (productToUnlink) {
            await updateProductSupplier(productToUnlink.id, '');
            setToastMessage({ message: `${productToUnlink.name} unlinked from supplier.`, type: 'success' });
            closeUnlinkProductModal();
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

    const openDetailsModal = (supply: GroupedSupply) => {
        setSelectedSupplyDetails(supply);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setSelectedSupplyDetails(null);
        setIsDetailsModalOpen(false);
    };
    
    const handlePrintSupplyDetails = () => {
        try {
            window.print();
            closeDetailsModal();
            setToastMessage({ message: 'Print command sent successfully!', type: 'success' });
        } catch (error) {
            console.error('Printing failed:', error);
            setToastMessage({ message: 'Printing failed. Please check your browser or printer settings.', type: 'error' });
        }
    };

    const supplyGrandTotal = useMemo(() => {
        return supplyItems.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
    }, [supplyItems]);

    const suppliedProducts = useMemo(() => {
        if (!editableSupplier) return [];
        return products.filter(p => p.supplierId === editableSupplier.id);
    }, [products, editableSupplier]);

    return (
        <div className="space-y-6">
             {toastMessage && (
                <div 
                    className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white ${toastMessage.type === 'success' ? 'bg-secondary' : 'bg-red-600'}`}
                    role="alert"
                >
                    {toastMessage.message}
                </div>
            )}
            <Card 
                title="Supplier List" 
                action={
                    <div className="flex items-center gap-4">
                        <Select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'recent' | 'a-z' | 'z-a')}>
                            <option value="recent">Recent</option>
                            <option value="a-z">A-Z</option>
                            <option value="z-a">Z-A</option>
                        </Select>
                        <Button onClick={() => setIsAddSupplierModalOpen(true)}>Add Supplier</Button>
                    </div>
                }
            >
                <div className="mb-4">
                    <Input
                        placeholder="Search for a supplier..."
                        value={supplierSearchTerm}
                        onChange={e => setSupplierSearchTerm(e.target.value)}
                    />
                </div>
                <Table headers={[
                        { label: 'Name', className: 'w-[250px]' },
                        { label: 'Contact Person', className: 'w-[200px]' },
                        { label: 'Phone', className: 'w-[150px]' },
                        { label: 'Items Supplied' },
                        { label: 'Actions', className: 'text-right w-[210px]' }
                    ]} scrollable={true} maxHeight="500px">
                        {sortedSuppliers.map(s => {
                            const suppliedProductNames = [
                                ...products.filter(p => p.supplierId === s.id).map(p => p.name),
                                ...s.itemsSupplied.filter(item => !products.some(p => p.supplierId === s.id && p.name === item))
                            ];

                            return (
                                <tr key={s.id} onClick={() => openEditModal(s)} className="cursor-pointer hover:bg-yellow-100">
                                    <td className="px-6 py-2 text-base font-medium text-text-primary truncate" title={s.name}>{s.name}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary truncate" title={s.contactPerson}>{s.contactPerson}</td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{s.phone}</td>
                                    <td className="px-6 py-2 text-base text-text-secondary truncate" title={suppliedProductNames.join(', ')}>
                                        {suppliedProductNames.join(', ')}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-base text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                        <Button size="sm" variant="secondary" onClick={() => openAddSupplyModal(s)}>Add Supply</Button>
                                        <Button size="sm" variant="danger" onClick={() => openDeleteModal(s)}>Delete</Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
            </Card>

            <Card title="Recent Supplies">
                 <div className="mb-4">
                    <div className="flex items-center gap-4">
                        <p className="font-medium text-text-secondary">Search by date:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                placeholder="DD"
                                value={searchDay}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchDay)}
                                maxLength={2}
                                className="w-[60px] bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="MM"
                                value={searchMonth}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchMonth)}
                                maxLength={2}
                                className="w-[60px] bg-gray-100 text-black border-primary"
                            />
                            <Input
                                placeholder="YYYY"
                                value={searchYear}
                                onChange={e => handleDateSearchChange(e.target.value, setSearchYear)}
                                maxLength={4}
                                className="w-24 bg-gray-100 text-black border-primary"
                            />
                        </div>
                    </div>
                    {dateSearchError && <p className="text-red-500 text-sm mt-2">{dateSearchError}</p>}
                </div>
                <Table headers={[
                        { label: 'Date & Time', className: 'w-[200px]' },
                        { label: 'Receipt', className: 'w-[130px]' },
                        { label: 'Supplier', className: 'w-[180px]' },
                        { label: 'Products' },
                        { label: 'Total Cost', className: 'w-[110px] text-right' }
                    ]} scrollable={true} maxHeight="600px">
                        {groupedRecentSupplies.map(group => (
                            <tr key={group.id} className="cursor-pointer hover:bg-yellow-100" onClick={() => openDetailsModal(group)}>
                                <td className="px-6 py-2 align-top whitespace-nowrap text-base text-text-secondary">{new Date(group.date).toLocaleString()}</td>
                                <td className="px-6 py-2 align-top whitespace-nowrap text-base text-text-secondary">{group.receiptNumber || 'N/A'}</td>
                                <td className="px-6 py-2 align-top text-base font-medium text-text-primary truncate" title={getSupplierName(group.supplierId)}>{getSupplierName(group.supplierId)}</td>
                                <td className="px-6 py-2 align-top text-base text-text-secondary">
                                    <div className="space-y-1">
                                        {group.items.map(item => (
                                            <div key={item.productId} className="flex justify-between items-center gap-4">
                                                <span className="truncate min-w-0" title={getProductName(item.productId)}>
                                                    {getProductName(item.productId)}
                                                </span>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <span className="whitespace-nowrap">
                                                        {item.quantity} x @ shs {item.unitCost.toFixed(2)}
                                                    </span>
                                                    <span className="font-semibold text-text-primary w-24 text-right">shs {(item.quantity * item.unitCost).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-2 align-top whitespace-nowrap text-base font-semibold text-text-primary text-right">shs {group.totalCost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
            </Card>

            <Modal isOpen={isAddSupplierModalOpen} onClose={closeAddSupplierModal} title="Add New Supplier" footer={
                <><Button onClick={handleAddSupplier}>Add Supplier</Button><Button variant="ghost" onClick={closeAddSupplierModal}>Cancel</Button></>
            }>
                <div className="space-y-4">
                    <Input 
                        ref={nameInputRef}
                        label="Supplier Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, contactPersonInputRef)}
                        error={formErrors.name}
                    />
                    <Input 
                        ref={contactPersonInputRef}
                        label="Contact Person" 
                        value={contactPerson} 
                        onChange={e => setContactPerson(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, phoneInputRef)}
                        error={formErrors.contactPerson}
                    />
                    <Input 
                        ref={phoneInputRef}
                        label="Phone" 
                        value={phone} 
                        onChange={handlePhoneChange}
                        onKeyDown={e => handleKeyDown(e, itemsSuppliedRef)}
                        error={formErrors.phone || phoneError}
                    />
                    <div>
                        <label htmlFor="itemsSupplied" className="block text-base font-medium text-text-secondary mb-1">Items Supplied (one per line)</label>
                        <textarea 
                            id="itemsSupplied"
                            ref={itemsSuppliedRef}
                            rows={4}
                            className="block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-slate-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-base"
                            value={itemsSuppliedText}
                            onChange={e => setItemsSuppliedText(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isAddSupplyModalOpen} onClose={closeAddSupplyModal} title={`New Supply for ${selectedSupplier?.name}`} size="4xl" footer={
                <><Button onClick={handleSaveSupply}>Save Supply</Button><Button variant="ghost" onClick={closeAddSupplyModal}>Cancel</Button></>
            }>
                 <div className="space-y-4">
                    <Input
                        label="Receipt Number (Optional)"
                        value={supplyReceiptNumber}
                        onChange={e => setSupplyReceiptNumber(e.target.value)}
                        placeholder="e.g., RCV-12345"
                    />

                    <div className="grid grid-cols-8 gap-4 items-end p-4 bg-slate-50 rounded-lg border">
                        <div className="col-span-4 flex items-end gap-2">
                                                               <Select label="Product" value={currentProductId} onChange={e => setCurrentProductId(e.target.value)} disabled={supplierProducts.length === 0}>
                                    <option value="">{supplierProducts.length > 0 ? 'Select a product' : 'No products found'}</option>
                                    {supplierProducts.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </Select>                            <Button variant="ghost" size="sm" onClick={() => setIsAddProductModalOpen(true)}>New</Button>
                        </div>
                        <div className="col-span-1"><Input label="Quantity" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} min="1" disabled={supplierProducts.length === 0} /></div>
                        <div className="col-span-2"><Input label="Unit Cost" type="number" value={currentUnitCost} onChange={e => setCurrentUnitCost(e.target.value)} min="0" placeholder="0.00" disabled={supplierProducts.length === 0} /></div>
                        <div className="col-span-1"><Button size="sm" onClick={handleAddProductToSupply} className="w-full" disabled={supplierProducts.length === 0}>Add</Button></div>
                        {supplierProducts.length === 0 && (
                             <div className="col-span-8 text-center text-sm text-gray-500">
                                No products are associated with this supplier. Please add them on the 'Products' page or create a new one.
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-text-primary">Supply Items</h4>
                        {supplyItems.length === 0 ? <p className="text-base text-center text-text-secondary py-4">No items added yet.</p> :
                        <div className="border rounded-lg overflow-hidden">
                            <Table headers={['Product', 'Qty', 'Unit Cost', 'Total', '']} scrollable={true} maxHeight="200px">
                                {supplyItems.map(item => (
                                    <tr key={item.productId}>
                                        <td className="px-4 py-2 text-base max-w-[120px] truncate text-gray-900" title={getProductName(item.productId)}>
                                            {getProductName(item.productId)}
                                        </td>
                                        <td className="px-4 py-2 text-base text-center text-gray-900">{item.quantity}</td>
                                        <td className="px-4 py-2 text-base text-right text-gray-900">shs {item.unitCost.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-base font-semibold text-right text-gray-900">shs {(item.quantity * item.unitCost).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <Button size="sm" variant="danger" onClick={() => handleRemoveProductFromSupply(item.productId)}>Remove</Button>
                                        </td>
                                    </tr>
                                ))}
                            </Table>
                        </div>}
                    </div>
                    
                    {supplyItems.length > 0 && <div className="pt-4 border-t border-border text-right">
                        <p className="text-xl font-bold text-text-primary">Grand Total: shs {supplyGrandTotal.toFixed(2)}</p>
                    </div>}
                </div>
            </Modal>
            
            <Modal
                isOpen={isAddProductModalOpen}
                onClose={() => setIsAddProductModalOpen(false)}
                title={`Add New Product for ${selectedSupplier?.name}`}
                footer={
                    <>
                        <Button onClick={handleSaveNewProduct}>Save Product</Button>
                        <Button variant="ghost" onClick={() => setIsAddProductModalOpen(false)}>Cancel</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Product Name"
                        value={newProductForSupplier.name}
                        onChange={e => setNewProductForSupplier({ name: e.target.value })}
                    />
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title={`Delete Supplier: ${selectedSupplier?.name}?`} footer={
                <><Button variant="danger" onClick={handleDeleteSupplier}>Confirm Delete</Button><Button variant="ghost" onClick={closeDeleteModal}>Cancel</Button></>
            }>
                <p>Are you sure you want to delete this supplier? This will permanently delete the supplier record. This action cannot be undone.</p>
                {associatedProductsCount > 0 && (
                    <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg">
                        <p className="font-bold">Warning:</p>
                        <p>This supplier is linked to <span className="font-bold">{associatedProductsCount}</span> product(s). Deleting the supplier will leave these products without an assigned supplier.</p>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                title={`Edit: ${editableSupplier?.name}`}
                size="2xl"
                footer={
                    <>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                        <Button variant="ghost" onClick={closeEditModal}>Close</Button>
                    </>
                }
            >
                {editableSupplier && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary border-b pb-2 mb-4">Supplier Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Supplier Name" 
                                    value={editableSupplier.name} 
                                    onChange={e => setEditableSupplier({ ...editableSupplier, name: e.target.value })}
                                />
                                <Input 
                                    label="Contact Person" 
                                    value={editableSupplier.contactPerson} 
                                    onChange={e => setEditableSupplier({ ...editableSupplier, contactPerson: e.target.value })}
                                />
                                <Input 
                                    label="Phone" 
                                    value={editableSupplier.phone} 
                                    onChange={e => setEditableSupplier({ ...editableSupplier, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary border-b pb-2 mb-4">Manage Products</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-text-secondary">Supplied Products ({suppliedProducts.length})</h4>
                                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2 bg-slate-50">
                                        {suppliedProducts.length > 0 ? suppliedProducts.map(p => (
                                            <div key={p.id} className="flex justify-between items-center gap-2 bg-white py-1 px-2 rounded shadow-sm hover:bg-yellow-50">
                                                <span className="text-text-primary truncate min-w-0" title={p.name}>{p.name}</span>
                                                <Button size="sm" variant="danger" className="!p-0.5 flex-shrink-0" onClick={() => openUnlinkProductModal(p)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )) : <p className="text-center text-text-secondary py-4">No products supplied.</p>}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-text-secondary">Add New Product</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-grow">
                                            <Input
                                                placeholder="Enter new product name"
                                                value={newProductName}
                                                onChange={(e) => setNewProductName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (newProductName.trim() && editableSupplier) {
                                                            addProduct({
                                                                name: newProductName.trim(),
                                                                price: 0,
                                                                stock: 0,
                                                                supplierId: editableSupplier.id,
                                                            });
                                                            setNewProductName('');
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (newProductName.trim() && editableSupplier) {
                                                    addProduct({
                                                        name: newProductName.trim(),
                                                        price: 0,
                                                        stock: 0,
                                                        supplierId: editableSupplier.id,
                                                    });
                                                    setNewProductName('');
                                                }
                                            }}
                                            disabled={!newProductName.trim()}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isUnlinkProductModalOpen} onClose={closeUnlinkProductModal} title={`Unlink Product: ${productToUnlink?.name}?`} footer={
                <><Button variant="danger" onClick={handleUnlinkProduct}>Confirm Unlink</Button><Button variant="ghost" onClick={closeUnlinkProductModal}>Cancel</Button></>
            }>
                <p>Are you sure you want to unlink <span className="font-semibold">{productToUnlink?.name}</span> from <span className="font-semibold">{editableSupplier?.name}</span>? This will remove the product from this supplier's list, but the product itself will not be deleted.</p>
            </Modal>

            <Modal
                isOpen={isDetailsModalOpen}
                onClose={closeDetailsModal}
                title={selectedSupplyDetails?.receiptNumber ? `Supply Details - Receipt #${selectedSupplyDetails.receiptNumber}` : 'Supply Details'}
                size="md"
                scrollable={true}
                footer={
                    <>
                        <Button onClick={handlePrintSupplyDetails}>Print Details</Button>
                        <Button variant="ghost" onClick={closeDetailsModal}>Close</Button>
                    </>
                }
            >
                {selectedSupplyDetails && (
                    <div className="printable-receipt p-4 font-mono text-black bg-white text-base">
                        <div className="text-center">
                            <h2 className="text-xl font-bold">SUPPLY INVOICE</h2>
                            <hr className="my-2 border-dashed border-black" />
                        </div>
                        
                        <div className="text-sm space-y-1">
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Supplier:</span>
                                <span className="text-right truncate" title={getSupplierName(selectedSupplyDetails.supplierId)}>{getSupplierName(selectedSupplyDetails.supplierId)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Date:</span>
                                <span className="text-right truncate">{new Date(selectedSupplyDetails.date).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4">
                                <span>Receipt:</span>
                                <span className="text-right truncate">{selectedSupplyDetails.receiptNumber || 'N/A'}</span>
                            </div>
                        </div>

                        <hr className="my-2 border-dashed border-black" />
                        <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 font-semibold text-xs uppercase text-center">
                            <span>Qty</span>
                            <span className="text-left">Product</span>
                            <span className="text-right">Total</span>
                        </div>
                        <hr className="my-2 border-dashed border-black" />
                        
                        <div className="my-2 space-y-2">
                            {selectedSupplyDetails.items.map(item => (
                                <div key={item.productId} className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-start text-sm">
                                    <div className="text-center font-semibold">{item.quantity}x</div>
                                    <div className="text-left min-w-0">
                                        <p className="truncate" title={getProductName(item.productId)}>{getProductName(item.productId)}</p>
                                        <p className="text-gray-600">@ shs {item.unitCost.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right font-semibold">shs {(item.quantity * item.unitCost).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>

                        <hr className="my-2 border-dashed border-black" />
                        <div className="grid grid-cols-2 gap-x-4 font-bold text-lg mt-2">
                            <span>GRAND TOTAL:</span>
                            <span className="text-right">shs {selectedSupplyDetails.totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default Suppliers;