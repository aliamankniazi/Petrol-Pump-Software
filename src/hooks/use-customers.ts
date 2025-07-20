
'use client';

import { useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'customers';

export function useCustomers() {
  const { data: customers, setData: setCustomers, isLoaded, clearDataForUser } = useLocalStorage<Customer[]>(STORAGE_KEY, []);
  
  const addCustomer = useCallback((customer: Omit<Customer, 'timestamp'> & { id?: string }): Customer => {
    const newCustomer = { 
        ...customer, 
        id: customer.id || crypto.randomUUID(), 
        timestamp: new Date().toISOString() 
    };
    setCustomers(prev => {
        const list = prev || [];
        if (customer.id && list.some(c => c.id === customer.id)) {
            return list;
        }
        const updatedCustomers = [newCustomer, ...list];
        return updatedCustomers.sort((a,b) => a.name.localeCompare(b.name));
    });
    return newCustomer;
  }, [setCustomers]);
  
  const updateCustomer = useCallback((id: string, updatedDetails: Partial<Omit<Customer, 'id' | 'timestamp'>>) => {
    setCustomers(prev => {
        const updatedCustomers = (prev || []).map(c => c.id === id ? { ...c, ...updatedDetails } : c);
        return updatedCustomers.sort((a,b) => a.name.localeCompare(b.name));
    });
  }, [setCustomers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => (prev || []).filter(c => c.id !== id));
  }, [setCustomers]);

  const clearCustomers = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { customers: customers || [], setCustomers, addCustomer, updateCustomer, deleteCustomer, clearCustomers, isLoaded };
}
