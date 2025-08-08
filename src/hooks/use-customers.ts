
'use client';

import { useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'customers';

export function useCustomers() {
  const { data: customers, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Customer>(COLLECTION_NAME);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'timestamp'>, docId?: string): Promise<Customer> => {
    const dataWithTimestamp = { ...customer, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp, docId);
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
    updateCustomer, 
    deleteCustomer, 
    isLoaded: !loading
  };
}
