'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useTransactions } from './use-transactions';
import { usePurchases } from './use-purchases';
import { usePurchaseReturns } from './use-purchase-returns';

const MANUAL_STOCK_KEY = 'pumppal-manual-fuel-stock';
const INITIAL_STOCK_KEY = 'pumppal-initial-fuel-stock';

const DEFAULT_INITIAL_STOCK: Record<FuelType, number> = {
  'Unleaded': 10000,
  'Premium': 5000,
  'Diesel': 15000,
};

export function useFuelStock() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  
  const [manualStock, setManualStock] = useState<Partial<Record<FuelType, { value: number; timestamp: string }>>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialStock, setInitialStock] = useState<Record<FuelType, number>>(DEFAULT_INITIAL_STOCK);

  useEffect(() => {
    try {
      const storedManual = localStorage.getItem(MANUAL_STOCK_KEY);
      if (storedManual) setManualStock(JSON.parse(storedManual));
      
      const storedInitial = localStorage.getItem(INITIAL_STOCK_KEY);
      if(storedInitial) setInitialStock(JSON.parse(storedInitial));

    } catch (error) {
      console.error("Failed to parse fuel stock from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(MANUAL_STOCK_KEY, JSON.stringify(manualStock));
      } catch (error) {
        console.error("Failed to save manual fuel stock to localStorage", error);
      }
    }
  }, [manualStock, isLoaded]);

  const fuelStock = useMemo(() => {
    if (!transactionsLoaded || !purchasesLoaded || !purchaseReturnsLoaded) {
      return initialStock;
    }

    const stock = { ...initialStock };

    for (const fuelType in stock) {
        const ft = fuelType as FuelType;

        const manualAdjustment = manualStock[ft];
        
        if (manualAdjustment) {
            stock[ft] = manualAdjustment.value;
        } else {
            const totalSold = transactions
                .filter(t => t.fuelType === ft)
                .reduce((sum, t) => sum + t.volume, 0);

            const totalPurchased = purchases
                .filter(p => p.fuelType === ft)
                .reduce((sum, p) => sum + p.volume, 0);

            const totalReturned = purchaseReturns
                .filter(pr => pr.fuelType === ft)
                .reduce((sum, pr) => sum + pr.volume, 0);
            
            stock[ft] = initialStock[ft] + totalPurchased - totalSold - totalReturned;
        }
    }
    
    return stock;
  }, [initialStock, manualStock, transactions, purchases, purchaseReturns, transactionsLoaded, purchasesLoaded, purchaseReturnsLoaded]);

  const setFuelStock = useCallback((fuelType: FuelType, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    
    setManualStock(prev => ({
      ...prev,
      [fuelType]: { value: newStock, timestamp: new Date().toISOString() },
    }));
  }, []);

  const clearFuelStock = useCallback(() => {
    setManualStock({});
    setInitialStock(DEFAULT_INITIAL_STOCK);
    try {
      localStorage.removeItem(MANUAL_STOCK_KEY);
      localStorage.removeItem(INITIAL_STOCK_KEY);
    } catch (error) {
      console.error("Failed to remove fuel stock from localStorage", error);
    }
  }, []);

  return { fuelStock, setFuelStock, clearFuelStock, isLoaded: isLoaded && transactionsLoaded && purchasesLoaded && purchaseReturnsLoaded };
}
