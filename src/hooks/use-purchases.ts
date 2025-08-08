
'use client';

import { useCallback } from 'react';
import type { Purchase, PurchaseItem } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';
import { useExpenses } from './use-expenses';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();
  const { addExpense } = useExpenses();

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    // Add the main purchase record
    addDoc(purchase);

    // Update stock for each item
    purchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });

    // If there are expenses, add them to the general expenses collection
    if (purchase.expenses && purchase.expenses > 0) {
        addExpense({
            description: `Expenses for purchase from ${purchase.supplier}`,
            category: 'Other', // Or a more specific category if needed
            amount: purchase.expenses,
            timestamp: purchase.timestamp || new Date().toISOString(),
        });
    }
    
  }, [addDoc, products, updateProductStock, addExpense]);
  
  const updatePurchase = useCallback((id: string, originalPurchase: Purchase, updatedPurchase: Partial<Omit<Purchase, 'id'>>) => {
      // Note: This logic for updating expenses associated with a purchase might need refinement.
      // Currently, it doesn't modify the original expense record.

      // 1. Revert stock from original purchase
      originalPurchase.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              const revertedStock = (product.stock || 0) - item.quantity;
              updateProductStock(item.productId, revertedStock);
          }
      });
      
      // 2. Add stock from updated purchase
      updatedPurchase.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            // It's safer to read the latest stock again after reverting
            const currentProduct = products.find(p => p.id === item.productId);
            const newStock = (currentProduct?.stock || 0) + item.quantity;
            updateProductStock(item.productId, newStock);
        }
      });

      // 3. Update the purchase document in the database
      updateDoc(id, updatedPurchase);

  }, [products, updateDoc, updateProductStock]);

  const deletePurchase = useCallback((purchaseToDelete: Purchase) => {
    if (!purchaseToDelete) return;

    // Note: This does not delete the associated expense record.

    purchaseToDelete.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = (product.stock || 0) - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    deleteDoc(purchaseToDelete.id!);
  }, [deleteDoc, products, updateProductStock]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    updatePurchase,
    deletePurchase, 
    isLoaded: !loading 
  };
}
