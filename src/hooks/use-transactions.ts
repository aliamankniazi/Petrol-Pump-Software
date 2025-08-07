
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useFuelStock } from './use-fuel-stock';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
  const { data: transactions, addDoc, deleteDoc, loading } = useDatabaseCollection<Transaction>(COLLECTION_NAME);
  const { fuelStock, setFuelStock } = useFuelStock();

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    // First, add the transaction to the database.
    addDoc(transaction);

    // Then, update the fuel stock for each item in the transaction.
    transaction.items.forEach(item => {
        const currentStock = fuelStock[item.fuelType] || 0;
        const newStock = currentStock - item.volume;
        setFuelStock(item.fuelType, newStock);
    });
    
  }, [addDoc, fuelStock, setFuelStock]);
  
  const deleteTransaction = useCallback((id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    
    // Add back the volume to the stock for each item
    transactionToDelete.items.forEach(item => {
        const currentStock = fuelStock[item.fuelType] || 0;
        const newStock = currentStock + item.volume;
        setFuelStock(item.fuelType, newStock);
    });
    
    // Delete the transaction
    deleteDoc(id);
  }, [deleteDoc, transactions, fuelStock, setFuelStock]);

  return { 
    transactions: transactions || [], 
    addTransaction, 
    deleteTransaction, 
    isLoaded: !loading 
  };
}
