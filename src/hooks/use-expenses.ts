
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '@/lib/types';

const STORAGE_KEY = 'pumppal-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
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
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch (error) {
        console.error("Failed to save expenses to localStorage", error);
      }
    }
  }, [expenses, isLoaded]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
        const newExpenses = [{ ...expense, id: crypto.randomUUID() }, ...prev];
        return newExpenses.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, []);
  
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  return { expenses, addExpense, deleteExpense, clearExpenses, isLoaded };
}
