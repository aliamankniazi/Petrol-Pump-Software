
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';

const COLLECTION_NAME = 'purchase-returns';

export function usePurchaseReturns() {
  const { data: purchaseReturns, addDoc, deleteDoc, loading } = useDatabaseCollection<PurchaseReturn>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();

  const addPurchaseReturn = useCallback((purchaseReturn: Omit<PurchaseReturn, 'id'>) => {
    addDoc(purchaseReturn);

    const product = products.find(p => p.id === purchaseReturn.productId);
    if(product) {
        const newStock = product.stock - purchaseReturn.volume;
        updateProductStock(product.id, newStock);
    }

  }, [addDoc, products, updateProductStock]);

  const deletePurchaseReturn = useCallback((id: string) => {
     const returnToDelete = purchaseReturns.find(pr => pr.id === id);
    if (!returnToDelete) return;

    const product = products.find(p => p.id === returnToDelete.productId);
    if(product) {
        const newStock = product.stock + returnToDelete.volume;
        updateProductStock(product.id, newStock);
    }
    
    deleteDoc(id);
  }, [deleteDoc, purchaseReturns, products, updateProductStock]);

  return { 
    purchaseReturns: purchaseReturns || [], 
    addPurchaseReturn, 
    deletePurchaseReturn, 
    isLoaded: !loading 
  };
}
