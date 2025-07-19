'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OtherIncome } from '@/lib/types';

const STORAGE_KEY = 'pumppal-other-incomes';

export function useOtherIncomes() {
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setOtherIncomes(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse other incomes from localStorage", error);
      setOtherIncomes([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(otherIncomes));
      } catch (error) {
        console.error("Failed to save other incomes to localStorage", error);
      }
    }
  }, [otherIncomes, isLoaded]);

  const addOtherIncome = useCallback((income: Omit<OtherIncome, 'id' | 'timestamp'>) => {
    setOtherIncomes(prev => [
      { ...income, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  
  const clearOtherIncomes = useCallback(() => {
    setOtherIncomes([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove other incomes from localStorage", error);
    }
  }, []);

  return { otherIncomes, addOtherIncome, clearOtherIncomes, isLoaded };
}
