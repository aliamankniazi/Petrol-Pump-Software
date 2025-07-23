
'use client';

import { useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

const COLLECTION_NAME = 'supplier-payments';

export function useSupplierPayments() {
  const { currentInstitution } = useInstitution();
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
