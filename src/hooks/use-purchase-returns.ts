
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';

const STORAGE_KEY = 'pumppal-purchase-returns';

export function usePurchaseReturns() {
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setPurchaseReturns(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse purchase returns from localStorage", error);
      setPurchaseReturns([]);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseReturns));
      } catch (error) {
        console.error("Failed to save purchase returns to localStorage", error);
      }
    }
  }, [purchaseReturns, isLoaded]);

  const addPurchaseReturn = useCallback((purchaseReturn: Omit<PurchaseReturn, 'id'>) => {
    setPurchaseReturns(prev => [
      { ...purchaseReturn, id: crypto.randomUUID() },
      ...prev,
    ]);
  }, []);

  const deletePurchaseReturn = useCallback((id: string) => {
    setPurchaseReturns(prev => prev.filter(pr => pr.id !== id));
  }, []);

  const clearPurchaseReturns = useCallback(() => {
    setPurchaseReturns([]);
  }, []);

  return { purchaseReturns, addPurchaseReturn, deletePurchaseReturn, clearPurchaseReturns, isLoaded };
}
