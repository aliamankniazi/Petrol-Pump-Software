
'use client';

import { useCallback } from 'react';
import type { CustomerPayment } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'customer-payments';

export function useCustomerPayments() {
  const { data: customerPayments, addDoc, deleteDoc, loading } = useFirestoreCollection<CustomerPayment>(COLLECTION_NAME);

  const addCustomerPayment = useCallback((payment: Omit<CustomerPayment, 'id'>) => {
    addDoc(payment);
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
