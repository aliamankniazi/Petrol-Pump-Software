
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';

const COLLECTION_NAME = 'purchase-returns';

export function usePurchaseReturns() {
  const { data: purchaseReturns, addDoc, deleteDoc, loading } = useDatabaseCollection<PurchaseReturn>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();

  const addPurchaseReturn = useCallback(async (purchaseReturn: Omit<PurchaseReturn, 'id'|'timestamp'>) => {
    const returnWithTimestamp = {
      ...purchaseReturn,
      timestamp: purchaseReturn.date.toISOString(),
    }
    const newDoc = await addDoc(returnWithTimestamp as PurchaseReturn);

    const product = products.find(p => p.id === purchaseReturn.productId);
    if(product) {
        const newStock = (product.stock || 0) - purchaseReturn.volume;
        updateProductStock(product.id!, newStock);
    }
    return newDoc;

  }, [addDoc, products, updateProductStock]);

  const deletePurchaseReturn = useCallback(async (id: string) => {
     const returnToDelete = purchaseReturns.find(pr => pr.id === id);
    if (!returnToDelete) return;

    const product = products.find(p => p.id === returnToDelete.productId);
    if(product) {
        const newStock = (product.stock || 0) + returnToDelete.volume;
        await updateProductStock(product.id!, newStock);
    }
    
    await deleteDoc(id);
  }, [deleteDoc, purchaseReturns, products, updateProductStock]);

  return { 
    purchaseReturns: purchaseReturns || [], 
    addPurchaseReturn, 
    deletePurchaseReturn, 
    isLoaded: !loading 
  };
}
