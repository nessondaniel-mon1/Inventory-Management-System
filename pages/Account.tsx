import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useInventory } from '../hooks/useInventory';
import type { Employee } from '../types';

const Account: React.FC = () => {
    const { employees, addEmployee, deleteEmployee } = useInventory();
    const adminUser = employees.find(e => e.role === 'admin');
    const employeeList = employees.filter(e => e.role !== 'admin');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
        name: '',
        role: 'employee',
        permissions: { canAccessAccounting: true, canAccessAnalytics: false, canManageEmployees: false }
    });

    const handleAddEmployee = () => {
        if (newEmployee.name) {
            addEmployee(newEmployee);
            setIsModalOpen(false);
            setNewEmployee({
                name: '',
                role: 'employee',
                permissions: { canAccessAccounting: true, canAccessAnalytics: false, canManageEmployees: false }
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Your Account Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Name" defaultValue={adminUser?.name} />
                    <Input label="Role" defaultValue={adminUser?.role} disabled />
                    <Input label="Email" type="email" placeholder="admin@inventory.com" />
                    <Input label="Password" type="password" placeholder="********" />
                </div>
                <div className="mt-6 text-right">
                    <Button>Save Changes</Button>
                </div>
            </Card>

            <Card title="Manage Employees" action={<Button onClick={() => setIsModalOpen(true)}>Add Employee</Button>}>
                <Table headers={['Name', 'Role', 'Permissions', 'Actions']}>
                    {employeeList.map(emp => (
                        <tr key={emp.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{emp.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary capitalize">{emp.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                {Object.entries(emp.permissions).filter(([,v]) => v).map(([k]) => k.replace('can', '')).join(', ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                <Button size="sm" variant="ghost">Edit</Button>
                                <Button size="sm" variant="danger" onClick={() => deleteEmployee(emp.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Employee" footer={
                <>
                    <Button onClick={handleAddEmployee}>Add Employee</Button>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                </>
            }>
                <div className="space-y-4">
                    <Input label="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">Permissions</label>
                        <div className="flex items-center">
                            <input id="accounting" type="checkbox" checked={newEmployee.permissions.canAccessAccounting} onChange={e => setNewEmployee({...newEmployee, permissions: {...newEmployee.permissions, canAccessAccounting: e.target.checked }})} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                            <label htmlFor="accounting" className="ml-2 block text-sm text-text-primary">Can Access Accounting</label>
                        </div>
                        <div className="flex items-center">
                            <input id="analytics" type="checkbox" checked={newEmployee.permissions.canAccessAnalytics} onChange={e => setNewEmployee({...newEmployee, permissions: {...newEmployee.permissions, canAccessAnalytics: e.target.checked }})} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                            <label htmlFor="analytics" className="ml-2 block text-sm text-text-primary">Can Access Analytics</label>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Account;