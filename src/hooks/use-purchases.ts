
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'purchases';

export function usePurchases() {
  const { data: purchases, setData: setPurchases, isLoaded } = useLocalStorage<Purchase[]>(STORAGE_KEY, []);

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    setPurchases(prev => [
      { ...purchase, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setPurchases]);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => (prev || []).filter(p => p.id !== id));
  }, [setPurchases]);
  
  const clearPurchases = useCallback(() => {
    setPurchases([]);
  }, [setPurchases]);

  return { purchases: purchases || [], addPurchase, deletePurchase, clearPurchases, isLoaded };
}
