
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';

const STORAGE_KEY = 'pumppal-supplier-payments';

export function useSupplierPayments() {
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setSupplierPayments(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse supplier payments from localStorage", error);
      setSupplierPayments([]);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(supplierPayments));
      } catch (error) {
        console.error("Failed to save supplier payments to localStorage", error);
      }
    }
  }, [supplierPayments, isLoaded]);

  const addSupplierPayment = useCallback((payment: Omit<SupplierPayment, 'id'>) => {
    setSupplierPayments(prev => [
      { ...payment, id: crypto.randomUUID() },
      ...prev,
    ]);
  }, []);

  const deleteSupplierPayment = useCallback((id: string) => {
    setSupplierPayments(prev => prev.filter(sp => sp.id !== id));
  }, []);

  const clearSupplierPayments = useCallback(() => {
    setSupplierPayments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove supplier payments from localStorage", error);
    }
  }, []);

  return { supplierPayments, addSupplierPayment, deleteSupplierPayment, clearSupplierPayments, isLoaded };
}
