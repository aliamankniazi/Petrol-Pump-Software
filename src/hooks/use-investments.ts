
'use client';

import { useCallback } from 'react';
import type { Investment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'investments';

export function useInvestments() {
  const { data: investments, addDoc, deleteDoc, loading } = useDatabaseCollection<Investment>(COLLECTION_NAME);

  const addInvestment = useCallback((investment: Omit<Investment, 'id' | 'timestamp'>) => {
    const investmentWithTimestamp = {
      ...investment,
      timestamp: investment.date,
    }
    addDoc(investmentWithTimestamp);
  }, [addDoc]);
  
  const deleteInvestment = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);

  return { 
    investments: investments || [], 
    addInvestment, 
    deleteInvestment, 
    isLoaded: !loading 
  };
}

