import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useInventory } from '../hooks/useInventory';
import type { Employee, UserPermissions, ReceiptSettings } from '../types';
import Select from '../components/ui/Select';
import { NAV_ITEMS } from '../constants';
import Spinner from '../components/ui/Spinner';

const Account: React.FC = () => {
    const { currentUser, users, addUser, deleteUser, receiptSettings, updateReceiptSettings, updateUser, updateAdminDetails } = useInventory();
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);
    
    // Filter out the current user from the list of employees to manage
    const employeeList = users.filter(e => e.id !== currentUser?.id);
    
    // --- State for Modals ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // --- State for Data Handling ---
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'> & { password?: string }>({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        permissions: { 
            canManageEmployees: false, dashboard: true, sales: true, accounting: true, 
            credits: false, payments: false, products: true, suppliers: false, 
            analytics: false, account: true 
        }
    });

    // --- State for Admin Details Form ---
    const [adminName, setAdminName] = useState(currentUser?.name || '');
    const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // --- State for Receipt Settings ---
    const [localReceiptSettings, setLocalReceiptSettings] = useState<ReceiptSettings>(receiptSettings);

    useEffect(() => {
        setLocalReceiptSettings(receiptSettings);
    }, [receiptSettings]);
    
     useEffect(() => {
        if (currentUser) {
            setAdminName(currentUser.name);
            setAdminEmail(currentUser.email);
        }
    }, [currentUser]);

    // --- Employee Management Functions ---
    const handleAddEmployee = async () => {
        if (newEmployee.name && newEmployee.password && newEmployee.email) {
            try {
                // In a real app, this would be a cloud function for security
                await addUser(newEmployee);
                closeAddModal();
            } catch (error: any) {
                alert(`Failed to add employee: ${error.message}`);
            }
        } else {
            alert("Username, email, and password are required.");
        }
    };

    const handleUpdateEmployee = async () => {
        if (employeeToEdit) {
            try {
                const { id, ...detailsToUpdate } = employeeToEdit;
                await updateUser(id, detailsToUpdate);
                closeEditModal();
            } catch (error: any) {
                alert(`Failed to update employee: ${error.message}`);
            }
        }
    };
    
    const handleConfirmDelete = async () => {
        if (employeeToDelete) {
            try {
                // In a real app, this would be a cloud function for security
                await deleteUser(employeeToDelete.id);
                closeDeleteModal();
            } catch (error: any) {
                alert(`Failed to delete employee: ${error.message}`);
            }
        }
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewEmployee({
            name: '',
            email: '',
            password: '',
            role: 'employee',
            permissions: { 
                canManageEmployees: false, dashboard: true, sales: true, accounting: true, 
                credits: false, payments: false, products: true, suppliers: false, 
                analytics: false, account: true 
            }
        });
    };

    const openEditModal = (employee: Employee) => {
        setEmployeeToEdit(JSON.parse(JSON.stringify(employee))); // Deep copy
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEmployeeToEdit(null);
    };
    
    const openDeleteModal = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setEmployeeToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handlePermissionChange = (perm: keyof UserPermissions, value: boolean) => {
        if (isAddModalOpen) {
            setNewEmployee(prev => ({ ...prev, permissions: { ...prev.permissions, [perm]: value } }));
        } else if (employeeToEdit) {
            setEmployeeToEdit(prev => prev ? ({ ...prev, permissions: { ...prev.permissions, [perm]: value } }) : null);
        }
    };

    // --- Admin Details Functions ---
    const handleAdminUpdate = async () => {
        if (!currentUser) return;
        setIsUpdating(true);
        setConfirmError('');
        try {
            await updateAdminDetails({
                userId: currentUser.id,
                currentPassword,
                name: adminName,
                email: adminEmail, // Email update might require verification flow
                newPassword: newPassword || undefined,
            });
            setIsConfirmModalOpen(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            setConfirmError(error.message || 'An error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const openConfirmModal = () => {
        setConfirmError('');
        setCurrentPassword('');
        setIsConfirmModalOpen(true);
    };

    // --- Receipt Settings Functions ---
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalReceiptSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveReceiptSettings = async () => {
        try {
            await updateReceiptSettings(localReceiptSettings);
            setToastMessage({ message: "Receipt settings saved successfully!", type: 'success' });
        } catch(error) {
            console.error("Failed to save receipt settings:", error);
            setToastMessage({ message: "Failed to save receipt settings. Please try again.", type: 'error' });
        }
    };
    
    if (!currentUser) return null;

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
            <Card title="Your Account Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Username" value={adminName} onChange={e => setAdminName(e.target.value)} />
                    <Input label="Email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                    <Input label="New Password" type="password" placeholder="Leave blank to keep current password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                     <div className="md:col-span-2 flex justify-end">
                        <Button onClick={openConfirmModal}>Update My Details</Button>
                    </div>
                </div>
            </Card>

            <Card title="Receipt Customization">
                <div className="space-y-4">
                    <div>
                        <label className="block text-base font-medium text-text-secondary mb-1">Company Logo</label>
                        <div className="flex items-center gap-4">
                            {localReceiptSettings.logo && (
                                <img src={localReceiptSettings.logo} alt="Company Logo" className="h-16 w-16 object-contain border p-1 rounded-md" />
                            )}
                            <Input type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="footerText" className="block text-base font-medium text-text-secondary mb-1">Footer Text</label>
                        <textarea
                            id="footerText"
                            rows={3}
                            className="block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-slate-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-base"
                            value={localReceiptSettings.footerText}
                            onChange={e => setLocalReceiptSettings(prev => ({ ...prev, footerText: e.target.value }))}
                        />
                    </div>
                    <div>
                         <Select
                            label="Font Size"
                            value={localReceiptSettings.fontSize}
                            onChange={e => setLocalReceiptSettings(prev => ({ ...prev, fontSize: e.target.value as ReceiptSettings['fontSize'] }))}
                         >
                            <option value="xs">Small</option>
                            <option value="sm">Medium</option>
                            <option value="base">Large</option>
                        </Select>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <Button onClick={handleSaveReceiptSettings}>Save Receipt Settings</Button>
                </div>
            </Card>

            {currentUser.permissions.canManageEmployees && (
                <Card title="Manage Employees" action={<Button onClick={() => setIsAddModalOpen(true)}>Add Employee</Button>}>
                    <Table headers={['Username', 'Email', 'Role', { label: 'Actions', className: 'text-right' }]} scrollable={true} maxHeight="400px">
                        {employeeList.map(emp => (
                            <tr key={emp.id}>
                                <td className="px-6 py-2 whitespace-nowrap text-base font-medium text-text-primary">{emp.name}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary">{emp.email}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base text-text-secondary capitalize">{emp.role}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-base space-x-2 text-right">
                                    <Button size="sm" variant="ghost" onClick={() => openEditModal(emp)}>Edit</Button>
                                    <Button size="sm" variant="danger" onClick={() => openDeleteModal(emp)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </Card>
            )}
            
            {(isAddModalOpen || isEditModalOpen) &&
                <Modal 
                    isOpen={isAddModalOpen || isEditModalOpen} 
                    onClose={isAddModalOpen ? closeAddModal : closeEditModal}
                    title={isAddModalOpen ? "Add New Employee" : "Edit Employee"} 
                    footer={
                    <>
                        <Button onClick={isAddModalOpen ? handleAddEmployee : handleUpdateEmployee}>{isAddModalOpen ? "Add Employee" : "Save Changes"}</Button>
                        <Button variant="ghost" onClick={isAddModalOpen ? closeAddModal : closeEditModal}>Cancel</Button>
                    </>
                }>
                    <div className="space-y-4">
                        <Input 
                            label="Username" 
                            value={isAddModalOpen ? newEmployee.name : employeeToEdit?.name || ''} 
                            onChange={e => isAddModalOpen ? setNewEmployee({...newEmployee, name: e.target.value}) : setEmployeeToEdit(p => p ? ({...p, name: e.target.value}) : null)} 
                        />
                         <Input 
                            label="Email"
                            type="email"
                            value={isAddModalOpen ? newEmployee.email : employeeToEdit?.email || ''} 
                            onChange={e => isAddModalOpen ? setNewEmployee({...newEmployee, email: e.target.value}) : setEmployeeToEdit(p => p ? ({...p, email: e.target.value}) : null)} 
                            disabled={isEditModalOpen} // Prevent editing email for now
                        />
                        {isAddModalOpen && <Input 
                            label="Password" 
                            type="password"
                            placeholder={isEditModalOpen ? "Enter new password to change" : ""}
                            value={newEmployee.password || ''} 
                            onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} 
                        />}
                        <div className="space-y-2">
                            <label className="block text-base font-medium text-text-secondary">Permissions</label>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="flex items-center">
                                    <input id="manage" type="checkbox" 
                                        checked={isAddModalOpen ? newEmployee.permissions.canManageEmployees : employeeToEdit?.permissions.canManageEmployees}
                                        onChange={e => handlePermissionChange('canManageEmployees', e.target.checked)}
                                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                                    <label htmlFor="manage" className="ml-2 block text-base text-text-primary">Manage Employees</label>
                                </div>
                                {NAV_ITEMS.map(item => (
                                    <div key={item.id} className="flex items-center">
                                        <input 
                                            id={item.id} 
                                            type="checkbox" 
                                            checked={(isAddModalOpen ? newEmployee.permissions[item.id] : employeeToEdit?.permissions[item.id]) || false}
                                            onChange={e => handlePermissionChange(item.id, e.target.checked)}
                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                                        <label htmlFor={item.id} className="ml-2 block text-base text-text-primary">Access {item.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            }

            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Your Identity"
                footer={
                    <>
                        <Button onClick={handleAdminUpdate} disabled={isUpdating}>
                            {isUpdating ? <Spinner size="sm" /> : "Confirm Update"}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p>To save these changes, please enter your current password.</p>
                    <Input
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            if (confirmError) setConfirmError('');
                        }}
                        error={confirmError}
                        autoFocus
                    />
                </div>
            </Modal>
            
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                title="Confirm Deletion"
                footer={
                    <>
                        <Button variant="danger" onClick={handleConfirmDelete}>Confirm Delete</Button>
                        <Button variant="ghost" onClick={closeDeleteModal}>Cancel</Button>
                    </>
                }
            >
                <p>Are you sure you want to delete the employee <span className="font-bold">{employeeToDelete?.name}</span>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default Account;
