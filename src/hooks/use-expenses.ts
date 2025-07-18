'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '@/lib/types';

const STORAGE_KEY = 'pumppal-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setExpenses(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse expenses from localStorage", error);
      setExpenses([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch (error) {
        console.error("Failed to save expenses to localStorage", error);
      }
    }
  }, [expenses, isLoaded]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'timestamp'>) => {
    setExpenses(prev => [
      { ...expense, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  
  const clearExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  return { expenses, addExpense, clearExpenses, isLoaded };
}
