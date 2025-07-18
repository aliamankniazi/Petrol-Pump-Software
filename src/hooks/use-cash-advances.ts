
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CashAdvance } from '@/lib/types';

const STORAGE_KEY = 'pumppal-cash-advances';

export function useCashAdvances() {
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setCashAdvances(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse cash advances from localStorage", error);
      setCashAdvances([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cashAdvances));
      } catch (error) {
        console.error("Failed to save cash advances to localStorage", error);
      }
    }
  }, [cashAdvances, isLoaded]);

  const addCashAdvance = useCallback((advance: Omit<CashAdvance, 'id' | 'timestamp'>) => {
    setCashAdvances(prev => [
      { ...advance, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  
  const clearCashAdvances = useCallback(() => {
    setCashAdvances([]);
  }, []);

  return { cashAdvances, addCashAdvance, clearCashAdvances, isLoaded };
}
