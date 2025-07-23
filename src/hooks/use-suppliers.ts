
'use client';

import { useCallback } from 'react';
import type { Supplier } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'suppliers';

export function useSuppliers() {
  const { currentInstitution } = useRoles();
  const { data: suppliers, addDoc, deleteDoc, loading } = useDatabaseCollection<Supplier>(COLLECTION_NAME, currentInstitution?.id || null);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'timestamp'>) => {
    return addDoc(supplier);
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
