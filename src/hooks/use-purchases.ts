
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

    // Then, update the fuel stock for each item
    purchase.items.forEach(item => {
        const currentStock = fuelStock[item.fuelType] || 0;
        const newStock = currentStock + item.volume;
        setFuelStock(item.fuelType, newStock);
    });

  }, [addDoc, fuelStock, setFuelStock]);

  const deletePurchase = useCallback((id: string) => {
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;

    // Subtract the volume from the stock for each item
    purchaseToDelete.items.forEach(item => {
        const currentStock = fuelStock[item.fuelType] || 0;
        const newStock = currentStock - item.volume;
        setFuelStock(item.fuelType, newStock);
    });
    
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
