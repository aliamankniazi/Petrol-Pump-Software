
'use client';

import { useCallback } from 'react';
import type { CustomerPayment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'customer-payments';

export function useCustomerPayments() {
  const { data: customerPayments, addDoc, deleteDoc, loading } = useDatabaseCollection<CustomerPayment>(COLLECTION_NAME);

  const addCustomerPayment = useCallback((payment: Omit<CustomerPayment, 'id'>) => {
    const paymentWithTimestamp = {
      ...payment,
      timestamp: payment.timestamp || new Date().toISOString(),
    };
    addDoc(paymentWithTimestamp);
  }, [addDoc]);
  
  const deleteCustomerPayment = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    customerPayments: customerPayments || [], 
    addCustomerPayment, 
    deleteCustomerPayment, 
    isLoaded: !loading
  };
}
