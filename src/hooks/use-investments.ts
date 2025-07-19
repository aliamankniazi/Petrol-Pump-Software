
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Investment } from '@/lib/types';

const STORAGE_KEY = 'pumppal-investments';

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setInvestments(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse investments from localStorage", error);
      setInvestments([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
      } catch (error) {
        console.error("Failed to save investments to localStorage", error);
      }
    }
  }, [investments, isLoaded]);

  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    setInvestments(prev => {
        const newInvestments = [
            { ...investment, id: crypto.randomUUID() },
            ...prev
        ];
        return newInvestments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, []);
  
  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const clearInvestments = useCallback(() => {
    setInvestments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove investments from localStorage", error);
    }
  }, []);

  return { investments, addInvestment, deleteInvestment, clearInvestments, isLoaded };
}
