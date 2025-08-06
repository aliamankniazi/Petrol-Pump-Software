
'use client';

import { useCallback } from 'react';
import type { PurchaseReturn } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useFuelStock } from './use-fuel-stock';

const COLLECTION_NAME = 'purchase-returns';

export function usePurchaseReturns() {
  const { data: purchaseReturns, addDoc, deleteDoc, loading } = useDatabaseCollection<PurchaseReturn>(COLLECTION_NAME);
  const { fuelStock, setFuelStock } = useFuelStock();

  const addPurchaseReturn = useCallback((purchaseReturn: Omit<PurchaseReturn, 'id'>) => {
    // First, add the return record
    addDoc(purchaseReturn);

    // Then, update the fuel stock
    const currentStock = fuelStock[purchaseReturn.fuelType] || 0;
    const newStock = currentStock - purchaseReturn.volume;
    setFuelStock(purchaseReturn.fuelType, newStock);

  }, [addDoc, fuelStock, setFuelStock]);

  const deletePurchaseReturn = useCallback((id: string) => {
     const returnToDelete = purchaseReturns.find(pr => pr.id === id);
    if (!returnToDelete) return;

    // Add back the volume to the stock
    const currentStock = fuelStock[returnToDelete.fuelType] || 0;
    const newStock = currentStock + returnToDelete.volume;
    setFuelStock(returnToDelete.fuelType, newStock);

    // Delete the return record
    deleteDoc(id);
  }, [deleteDoc, purchaseReturns, fuelStock, setFuelStock]);

  return { 
    purchaseReturns: purchaseReturns || [], 
    addPurchaseReturn, 
    deletePurchaseReturn, 
    isLoaded: !loading 
  };
}
