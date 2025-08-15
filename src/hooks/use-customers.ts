

'use client';

import { useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'customers';

export function useCustomers() {
  const { data: customers, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Customer>(COLLECTION_NAME);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'timestamp'>): Promise<Customer> => {
    const dataWithTimestamp = { ...customer, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);
    return newDoc;
  }, [addDoc]);

  const addCustomerWithId = useCallback(async (id: string, customer: Omit<Customer, 'id' | 'timestamp'>): Promise<Customer> => {
    const dataWithTimestamp = { ...customer, timestamp: new Date().toISOString() };
    // This uses the underlying addDoc but provides a specific ID, which is useful for linking to auth users
    const newDoc = await addDoc(dataWithTimestamp, id);
    return newDoc;
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
    addCustomerWithId,
    updateCustomer, 
    deleteCustomer, 
    isLoaded: !loading
  };
}
