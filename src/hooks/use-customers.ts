'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';

const STORAGE_KEY = 'pumppal-customers';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
      } catch (error) {
        console.error("Failed to save customers to localStorage", error);
      }
    }
  }, [customers, isLoaded]);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'timestamp'>) => {
    setCustomers(prev => [
      { ...customer, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const clearCustomers = useCallback(() => {
    setCustomers([]);
  }, []);

  return { customers, addCustomer, clearCustomers, isLoaded };
}
