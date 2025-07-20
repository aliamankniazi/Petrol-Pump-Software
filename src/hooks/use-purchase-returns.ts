
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'purchase-returns';

export function usePurchaseReturns() {
  const { data: purchaseReturns, setData: setPurchaseReturns, isLoaded, clearDataForUser } = useLocalStorage<PurchaseReturn[]>(STORAGE_KEY, []);

  const addPurchaseReturn = useCallback((purchaseReturn: Omit<PurchaseReturn, 'id'>) => {
    setPurchaseReturns(prev => [
      { ...purchaseReturn, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setPurchaseReturns]);

  const deletePurchaseReturn = useCallback((id: string) => {
    setPurchaseReturns(prev => (prev || []).filter(pr => pr.id !== id));
  }, [setPurchaseReturns]);

  const clearPurchaseReturns = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { purchaseReturns: purchaseReturns || [], addPurchaseReturn, deletePurchaseReturn, clearPurchaseReturns, isLoaded };
}
