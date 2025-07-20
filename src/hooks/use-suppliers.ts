
'use client';

import { useCallback } from 'react';
import type { Supplier } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'suppliers';

export function useSuppliers() {
  const { data: suppliers, setData: setSuppliers, isLoaded, clearDataForUser } = useLocalStorage<Supplier[]>(STORAGE_KEY, []);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'timestamp'>) => {
    setSuppliers(prev => [
      { ...supplier, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...(prev || []),
    ]);
  }, [setSuppliers]);
  
  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => (prev || []).filter(s => s.id !== id));
  }, [setSuppliers]);

  const clearSuppliers = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { suppliers: suppliers || [], addSupplier, deleteSupplier, clearSuppliers, isLoaded };
}
