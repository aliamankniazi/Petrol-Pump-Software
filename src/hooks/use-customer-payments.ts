
'use client';

import { useCallback } from 'react';
import type { CustomerPayment } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'customer-payments';

export function useCustomerPayments() {
  const { data: customerPayments, setData: setCustomerPayments, isLoaded } = useLocalStorage<CustomerPayment[]>(STORAGE_KEY, []);

  const addCustomerPayment = useCallback((payment: Omit<CustomerPayment, 'id' | 'timestamp'>) => {
    setCustomerPayments(prev => [
      { ...payment, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...(prev || []),
    ]);
  }, [setCustomerPayments]);
  
  const deleteCustomerPayment = useCallback((id: string) => {
    setCustomerPayments(prev => (prev || []).filter(p => p.id !== id));
  }, [setCustomerPayments]);

  const clearCustomerPayments = useCallback(() => {
    setCustomerPayments([]);
  }, [setCustomerPayments]);

  return { customerPayments: customerPayments || [], addCustomerPayment, deleteCustomerPayment, clearCustomerPayments, isLoaded };
}
