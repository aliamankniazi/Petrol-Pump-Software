
'use client';

import { useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'customers';

export function useCustomers() {
  const { data: customers, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Customer>(COLLECTION_NAME);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'timestamp'>): Promise<Customer> => {
    const newDoc = await addDoc(customer);
    return { ...customer, id: newDoc.id, timestamp: Date.now() };
  }, [addDoc]);
  
  const updateCustomer = useCallback((id: string, updatedDetails: Partial<Omit<Customer, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteCustomer = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    customers: customers || [], 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    isLoaded: !loading
  };
}
