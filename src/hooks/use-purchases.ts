
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';
import { useExpenses } from './use-expenses';
import { useSupplierPayments } from './use-supplier-payments';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();
  const { addExpense } = useExpenses();
  const { addSupplierPayment } = useSupplierPayments();

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id' | 'timestamp'>) => {
    const purchaseWithTimestamp = {
      ...purchase,
      timestamp: purchase.date.toISOString(),
    }
    addDoc(purchaseWithTimestamp);

    // Update product stock based on purchased items
    purchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });

    // If there are extra expenses, log them as a separate expense record
    if (purchase.expenses && purchase.expenses > 0) {
        addExpense({
            description: `Expenses for purchase from ${purchase.supplier}`,
            category: 'Other',
            amount: purchase.expenses,
            date: purchase.date,
        });
    }

    // If a payment was made at the time of purchase, create a supplier payment record
    if (purchase.paidAmount && purchase.paidAmount > 0) {
        addSupplierPayment({
            supplierId: purchase.supplierId,
            supplierName: purchase.supplier,
            amount: purchase.paidAmount,
            paymentMethod: "Cash", // Defaulting to cash, can be expanded later
            date: purchase.date,
        });
    }
    
  }, [addDoc, products, updateProductStock, addExpense, addSupplierPayment]);
  
  const updatePurchase = useCallback((id: string, originalPurchase: Purchase, updatedPurchase: Partial<Omit<Purchase, 'id' | 'timestamp'>>) => {
      // Revert stock from original purchase
      originalPurchase.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              const revertedStock = (product.stock || 0) - item.quantity;
              updateProductStock(item.productId, revertedStock);
          }
      });
      
      // Add stock from updated purchase
      updatedPurchase.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const currentProduct = products.find(p => p.id === item.productId);
            const newStock = (currentProduct?.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
      });

      updateDoc(id, updatedPurchase);

  }, [products, updateDoc, updateProductStock]);

  const deletePurchase = useCallback((purchaseId: string) => {
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    // Revert stock changes from the deleted purchase
    purchaseToDelete.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    deleteDoc(purchaseToDelete.id!);
  }, [deleteDoc, purchases, products, updateProductStock]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    updatePurchase,
    deletePurchase, 
    isLoaded: !loading 
  };
}

    
