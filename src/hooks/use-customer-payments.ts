
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CustomerPayment } from '@/lib/types';

const STORAGE_KEY = 'pumppal-customer-payments';

export function useCustomerPayments() {
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setCustomerPayments(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse customer payments from localStorage", error);
      setCustomerPayments([]);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customerPayments));
      } catch (error) {
        console.error("Failed to save customer payments to localStorage", error);
      }
    }
  }, [customerPayments, isLoaded]);

  const addCustomerPayment = useCallback((payment: Omit<CustomerPayment, 'id' | 'timestamp'>) => {
    setCustomerPayments(prev => [
      { ...payment, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  
  const deleteCustomerPayment = useCallback((id: string) => {
    setCustomerPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearCustomerPayments = useCallback(() => {
    setCustomerPayments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove customer payments from localStorage", error);
    }
  }, []);

  return { customerPayments, addCustomerPayment, deleteCustomerPayment, clearCustomerPayments, isLoaded };
}
