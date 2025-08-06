
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

    // Then, update the fuel stock. This is a separate operation.
    const currentStock = fuelStock[transaction.fuelType] || 0;
    const newStock = currentStock - transaction.volume;
    setFuelStock(transaction.fuelType, newStock);
    
  }, [addDoc, fuelStock, setFuelStock]);
  
  const deleteTransaction = useCallback((id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    
    // Add back the volume to the stock
    const currentStock = fuelStock[transactionToDelete.fuelType] || 0;
    const newStock = currentStock + transactionToDelete.volume;
    setFuelStock(transactionToDelete.fuelType, newStock);
    
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
