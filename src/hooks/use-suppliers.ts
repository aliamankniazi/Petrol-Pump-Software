
'use client';

import { useCallback } from 'react';
import type { Supplier } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'suppliers';

export function useSuppliers() {
  const { data: suppliers, addDoc, deleteDoc, loading } = useFirestoreCollection<Supplier>(COLLECTION_NAME);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'timestamp'>) => {
    addDoc(supplier);
  }, [addDoc]);
  
  const deleteSupplier = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    suppliers: suppliers || [], 
    addSupplier, 
    deleteSupplier, 
    isLoaded: !loading 
  };
}
