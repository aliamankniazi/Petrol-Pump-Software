
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, deleteDoc, loading } = useFirestoreCollection<Purchase>(COLLECTION_NAME);

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    addDoc(purchase);
  }, [addDoc]);

  const deletePurchase = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    deletePurchase, 
    isLoaded: !loading 
  };
}
