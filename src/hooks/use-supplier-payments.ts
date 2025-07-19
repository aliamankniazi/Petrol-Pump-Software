'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';

const STORAGE_KEY = 'pumppal-supplier-payments';

export function useSupplierPayments() {
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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

  const clearSupplierPayments = useCallback(() => {
    setSupplierPayments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove supplier payments from localStorage", error);
    }
  }, []);

  return { supplierPayments, addSupplierPayment, clearSupplierPayments, isLoaded };
}
