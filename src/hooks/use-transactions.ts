
'use client';

import { useCallback } from 'react';
import type { Transaction } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';
import { useCustomerPayments } from './use-customer-payments';
import { useExpenses } from './use-expenses';

const COLLECTION_NAME = 'transactions';

export function useTransactions() {
  const { data: transactions, addDoc, deleteDoc, loading } = useDatabaseCollection<Transaction>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();
  const { addCustomerPayment } = useCustomerPayments();
  const { addExpense } = useExpenses();

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const transactionWithTimestamp = {
      ...transaction,
      timestamp: transaction.timestamp || new Date().toISOString(),
    };
    
    const newDoc = await addDoc(transactionWithTimestamp);

    transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    if (transaction.paidAmount && transaction.paidAmount > 0 && transaction.paymentMethod && transaction.paymentMethod !== 'On Credit' && transaction.customerId && transaction.customerName) {
        addCustomerPayment({
            customerId: transaction.customerId,
            customerName: transaction.customerName,
            amount: transaction.paidAmount,
            paymentMethod: transaction.paymentMethod,
            timestamp: transaction.timestamp || new Date().toISOString(),
        });
    }
    
    if (transaction.expenseAmount && transaction.expenseAmount > 0) {
        addExpense({
            description: `Expense from sale to ${transaction.customerName || 'Walk-in'}`,
            category: 'Other',
            amount: transaction.expenseAmount,
            timestamp: transaction.timestamp || new Date().toISOString(),
        });
    }

    return newDoc;
  }, [addDoc, products, updateProductStock, addCustomerPayment, addExpense]);
  
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
