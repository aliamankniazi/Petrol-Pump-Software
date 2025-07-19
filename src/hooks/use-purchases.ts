
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Purchase } from '@/lib/types';

const STORAGE_KEY = 'pumppal-purchases';

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setPurchases(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse purchases from localStorage", error);
      setPurchases([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
      } catch (error) {
        console.error("Failed to save purchases to localStorage", error);
      }
    }
  }, [purchases, isLoaded]);

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    setPurchases(prev => [
      { ...purchase, id: crypto.randomUUID() },
      ...prev,
    ]);
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);
  
  const clearPurchases = useCallback(() => {
    setPurchases([]);
  }, []);

  return { purchases, addPurchase, deletePurchase, clearPurchases, isLoaded };
}
