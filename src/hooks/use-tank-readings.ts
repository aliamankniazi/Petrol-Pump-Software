
'use client';

import { useCallback } from 'react';
import type { TankReading } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';

const COLLECTION_NAME = 'tank-readings';

export function useTankReadings() {
  const { data: tankReadings, addDoc, loading } = useDatabaseCollection<TankReading>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();

  const addTankReading = useCallback((reading: Omit<TankReading, 'id'>) => {
    addDoc(reading);
    // When a new reading is added, update the stock of that product
    if (reading.productId) {
      updateProductStock(reading.productId, reading.volume);
    }
  }, [addDoc, updateProductStock]);

  return { 
    tankReadings: tankReadings || [], 
    addTankReading, 
    isLoaded: !loading 
  };
}
