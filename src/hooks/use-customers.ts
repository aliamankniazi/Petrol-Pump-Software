

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';

const STORAGE_KEY = 'pumppal-customers';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setCustomers(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse customers from localStorage", error);
      setCustomers([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
      } catch (error) {
        console.error("Failed to save customers to localStorage", error);
      }
    }
  }, [customers, isLoaded]);

  const addCustomer = useCallback((customer: Omit<Customer, 'timestamp'> & { id?: string }): Customer => {
    const newCustomer = { 
        ...customer, 
        id: customer.id || crypto.randomUUID(), 
        timestamp: new Date().toISOString() 
    };
    setCustomers(prev => {
        // Avoid adding duplicates if an ID is provided
        if (customer.id && prev.some(c => c.id === customer.id)) {
            return prev;
        }
        return [newCustomer, ...prev].sort((a,b) => a.name.localeCompare(b.name));
    });
    return newCustomer;
  }, []);
  
  const updateCustomer = useCallback((id: string, updatedDetails: Partial<Omit<Customer, 'id' | 'timestamp'>>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedDetails } : c).sort((a,b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    // If the customer is also a partner, we only remove their 'customer' status
    // by setting isPartner to true and keeping them in the list.
    // If they are not a partner, we remove them completely.
    const customer = customers.find(c => c.id === id);
    if (customer?.isPartner) {
        // This case is handled by deleting a Business Partner, which preserves the customer record.
        // To delete a customer who is also a partner, one must go through the investments page.
        // Here we just mark them as not a standard customer if they are deleted from customer page
        // A better approach would be to disable deletion from this page. For now, just update.
        updateCustomer(id, { ...customer, name: `${customer.name} (Archived)` });
    } else {
        setCustomers(prev => prev.filter(c => c.id !== id));
    }
  }, [customers, updateCustomer]);

  const clearCustomers = useCallback(() => {
    setCustomers([]);
  }, []);

  return { customers, setCustomers, addCustomer, updateCustomer, deleteCustomer, clearCustomers, isLoaded };
}
