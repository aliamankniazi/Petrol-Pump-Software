
'use client';

import { useCallback } from 'react';
import type { CustomerPayment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

const COLLECTION_NAME = 'customer-payments';

export function useCustomerPayments() {
  const { currentInstitution } = useInstitution();
  const { data: customerPayments, addDoc, deleteDoc, loading } = useDatabaseCollection<CustomerPayment>(COLLECTION_NAME, currentInstitution?.id || null);

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
