
'use client';

import { useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'supplier-payments';

export function useSupplierPayments() {
  const { currentInstitution } = useRoles();
  const { data: supplierPayments, addDoc, deleteDoc, loading } = useDatabaseCollection<SupplierPayment>(COLLECTION_NAME, currentInstitution?.id || null);

  const addSupplierPayment = useCallback((payment: Omit<SupplierPayment, 'id'>) => {
    addDoc(payment);
  }, [addDoc]);

  const deleteSupplierPayment = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    supplierPayments: supplierPayments || [], 
    addSupplierPayment, 
    deleteSupplierPayment, 
    isLoaded: !loading
  };
}
