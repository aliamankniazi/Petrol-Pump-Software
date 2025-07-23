
'use client';

import { useCallback } from 'react';
import type { Investment } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'investments';

export function useInvestments() {
  const { currentInstitution } = useRoles();
  const { data: investments, addDoc, deleteDoc, loading } = useDatabaseCollection<Investment>(COLLECTION_NAME, currentInstitution?.id || null);

  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    addDoc(investment);
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
