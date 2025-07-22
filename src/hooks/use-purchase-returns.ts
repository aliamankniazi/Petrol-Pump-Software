
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution';

const COLLECTION_NAME = 'purchase-returns';

export function usePurchaseReturns() {
  const { currentInstitution } = useInstitution();
  const { data: purchaseReturns, addDoc, deleteDoc, loading } = useDatabaseCollection<PurchaseReturn>(COLLECTION_NAME, currentInstitution?.id || null);

  const addPurchaseReturn = useCallback((purchaseReturn: Omit<PurchaseReturn, 'id'>) => {
    addDoc(purchaseReturn);
  }, [addDoc]);

  const deletePurchaseReturn = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    purchaseReturns: purchaseReturns || [], 
    addPurchaseReturn, 
    deletePurchaseReturn, 
    isLoaded: !loading 
  };
}
