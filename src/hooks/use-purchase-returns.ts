
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'purchase-returns';

export function usePurchaseReturns() {
  const { data: purchaseReturns, addDoc, deleteDoc, loading } = useFirestoreCollection<PurchaseReturn>(COLLECTION_NAME);

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
