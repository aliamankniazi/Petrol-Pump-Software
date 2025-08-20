
'use client';

import { useCallback } from 'react';
import type { TankReading } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useProducts } from './use-products';
import { useTransactions } from './use-transactions';

const COLLECTION_NAME = 'tank-readings';

export function useTankReadings() {
  const { data: tankReadings, addDoc, loading } = useDatabaseCollection<TankReading>(COLLECTION_NAME);
  const { products, updateProductStock } = useProducts();
  const { transactions } = useTransactions();

  const addTankReading = useCallback(async (reading: Omit<TankReading, 'id' | 'calculatedUsage' | 'salesSinceLastReading' | 'variance'>) => {
    
    // Find the previous reading for the same tank
    const lastReading = tankReadings
        .filter(r => r.productId === reading.productId)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        [0];

    const previousMeterReading = lastReading ? lastReading.meterReading : 0;
    const lastReadingTimestamp = lastReading ? new Date(lastReading.timestamp) : new Date(0);
    const currentReadingTimestamp = new Date(reading.timestamp);
    
    // Calculate usage based on meter difference
    const calculatedUsage = reading.meterReading - previousMeterReading;
    
    // Find all sales of this product since the last reading
    const salesSinceLastReading = transactions
      .filter(tx => {
          const txDate = new Date(tx.timestamp!);
          return txDate > lastReadingTimestamp && txDate <= currentReadingTimestamp;
      })
      .flatMap(tx => tx.items)
      .filter(item => item.productId === reading.productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    // Calculate variance
    const variance = calculatedUsage - salesSinceLastReading;

    const readingWithCalculations: TankReading = {
      ...reading,
      previousMeterReading,
      calculatedUsage,
      salesSinceLastReading,
      variance,
    }

    const newDoc = await addDoc(readingWithCalculations);
    
    // Update the stock of that product by decrementing the usage
    if (reading.productId && calculatedUsage > 0) {
      const product = products.find(p => p.id === reading.productId);
      if (product) {
        const newStock = (product.stock || 0) - calculatedUsage;
        await updateProductStock(reading.productId, newStock);
      }
    }
    return newDoc;
  }, [addDoc, updateProductStock, tankReadings, transactions, products]);

  return { 
    tankReadings: tankReadings || [], 
    addTankReading, 
    isLoaded: !loading 
  };
}
