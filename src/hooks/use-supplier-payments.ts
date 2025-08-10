
'use client';

import { useCallback } from 'react';
import type { SupplierPayment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'supplier-payments';

export function useSupplierPayments() {
  const { data: supplierPayments, addDoc, deleteDoc, loading } = useDatabaseCollection<SupplierPayment>(COLLECTION_NAME);

  const addSupplierPayment = useCallback((payment: Omit<SupplierPayment, 'id' | 'timestamp'>) => {
    const paymentWithTimestamp = {
      ...payment,
      timestamp: payment.date,
    }
    addDoc(paymentWithTimestamp);
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

