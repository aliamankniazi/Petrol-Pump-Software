
'use client';

import { useCallback } from 'react';
import type { Investment } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'investments';

export function useInvestments() {
  const { data: investments, setData: setInvestments, isLoaded, clearDataForUser } = useLocalStorage<Investment[]>(STORAGE_KEY, []);

  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    setInvestments(prev => {
        const newInvestments = [
            { ...investment, id: crypto.randomUUID() },
            ...(prev || [])
        ];
        return newInvestments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [setInvestments]);
  
  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => (prev || []).filter(inv => inv.id !== id));
  }, [setInvestments]);

  const clearInvestments = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { investments: investments || [], addInvestment, deleteInvestment, clearInvestments, isLoaded };
}
