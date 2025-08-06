
'use client';

import { useCallback } from 'react';
import type { Supplier } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'suppliers';

export function useSuppliers() {
  const { data: suppliers, addDoc, deleteDoc, loading } = useDatabaseCollection<Supplier>(COLLECTION_NAME);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'timestamp'>): Promise<Supplier> => {
    const dataWithTimestamp = { ...supplier, timestamp: new Date().toISOString() };
    const newDoc = await addDoc(dataWithTimestamp);
    return newDoc;
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
