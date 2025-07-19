
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '@/lib/types';

const STORAGE_KEY = 'pumppal-transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setTransactions(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse transactions from localStorage", error);
      setTransactions([]);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      } catch (error) {
        console.error("Failed to save transactions to localStorage", error);
      }
    }
  }, [transactions, isLoaded]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [
      { ...transaction, id: crypto.randomUUID() },
      ...prev,
    ]);
  }, []);
  
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  return { transactions, addTransaction, deleteTransaction, clearTransactions, isLoaded };
}
