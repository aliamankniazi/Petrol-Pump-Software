
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    addDoc(purchase);

    purchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = product.stock + item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });

  }, [addDoc, products, updateProductStock]);

  const deletePurchase = useCallback((id: string) => {
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;

    purchaseToDelete.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const newStock = product.stock - item.quantity;
            updateProductStock(item.productId, newStock);
        }
    });
    
    deleteDoc(id);
  }, [deleteDoc, purchases, products, updateProductStock]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    deletePurchase, 
    isLoaded: !loading 
  };
}
