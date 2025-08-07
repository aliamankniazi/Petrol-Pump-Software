
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
  const { data: transactions, addDoc, deleteDoc, loading } = useDatabaseCollection<Transaction>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    addDoc(transaction);

    transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
  }, [addDoc, products, updateProductStock]);
  
  const deleteTransaction = useCallback((id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    
    transactionToDelete.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    deleteDoc(id);
  }, [deleteDoc, transactions, products, updateProductStock]);

  return { 
    transactions: transactions || [], 
    addTransaction, 
    deleteTransaction, 
    isLoaded: !loading 
  };
}
