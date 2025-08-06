
'use client';

import { useCallback } from 'react';
import type { Purchase } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useFuelStock } from './use-fuel-stock';

const COLLECTION_NAME = 'purchases';

export function usePurchases() {
  const { data: purchases, addDoc, deleteDoc, loading } = useDatabaseCollection<Purchase>(COLLECTION_NAME);
  const { fuelStock, setFuelStock } = useFuelStock();

  const addPurchase = useCallback((purchase: Omit<Purchase, 'id'>) => {
    // First, add the purchase record
    addDoc(purchase);

    // Then, update the fuel stock
    const currentStock = fuelStock[purchase.fuelType] || 0;
    const newStock = currentStock + purchase.volume;
    setFuelStock(purchase.fuelType, newStock);

  }, [addDoc, fuelStock, setFuelStock]);

  const deletePurchase = useCallback((id: string) => {
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;

    // Subtract the volume from the stock
    const currentStock = fuelStock[purchaseToDelete.fuelType] || 0;
    const newStock = currentStock - purchaseToDelete.volume;
    setFuelStock(purchaseToDelete.fuelType, newStock);
    
    // Delete the purchase record
    deleteDoc(id);
  }, [deleteDoc, purchases, fuelStock, setFuelStock]);
  
  return { 
    purchases: purchases || [], 
    addPurchase, 
    deletePurchase, 
    isLoaded: !loading 
  };
}
