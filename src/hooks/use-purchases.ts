
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { currentInstitution } = useInstitution();
  const { data: purchases, addDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME, currentInstitution?.id || null);

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
