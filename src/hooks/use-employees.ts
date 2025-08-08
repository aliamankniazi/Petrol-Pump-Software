
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useCustomers } from './use-customers';

const COLLECTION_NAME = 'employees';

export function useEmployees() {
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Employee>(COLLECTION_NAME);
  const { addCustomer } = useCustomers();

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id' | 'timestamp'>): Promise<Employee> => {
    const dataWithTimestamp = { ...employee, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);

    // Create a corresponding customer record for ledger purposes, using the same ID
    await addCustomer({
        name: newDoc.name,
        contact: newDoc.mobileNumber || '',
        area: 'Employee',
        isPartner: false,
        isEmployee: true,
    }, newDoc.id);

    return newDoc;
  }, [addDoc, addCustomer]);

  const updateEmployee = useCallback((id: string, updatedDetails: Partial<Omit<Employee, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteEmployee = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    employees: employees || [], 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    isLoaded: !loading 
  };
}
