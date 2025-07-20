
'use client';

import { useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'supplier-payments';

export function useSupplierPayments() {
  const { data: supplierPayments, setData: setSupplierPayments, isLoaded, clearDataForUser } = useLocalStorage<SupplierPayment[]>(STORAGE_KEY, []);

  const addSupplierPayment = useCallback((payment: Omit<SupplierPayment, 'id'>) => {
    setSupplierPayments(prev => [
      { ...payment, id: crypto.randomUUID() },
      ...(prev || []),
    ]);
  }, [setSupplierPayments]);

  const deleteSupplierPayment = useCallback((id: string) => {
    setSupplierPayments(prev => (prev || []).filter(sp => sp.id !== id));
  }, [setSupplierPayments]);

  const clearSupplierPayments = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { supplierPayments: supplierPayments || [], addSupplierPayment, deleteSupplierPayment, clearSupplierPayments, isLoaded };
}
