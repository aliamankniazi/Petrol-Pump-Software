'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useTransactions } from './use-transactions';
import { usePurchases } from './use-purchases';
import { usePurchaseReturns } from './use-purchase-returns';

const MANUAL_STOCK_KEY = 'pumppal-manual-fuel-stock';

const DEFAULT_FUEL_STOCK: Record<FuelType, number> = {
  'Unleaded': 10000,
  'Premium': 5000,
  'Diesel': 15000,
};

export function useFuelStock() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  
  const [manualStock, setManualStock] = useState<Partial<Record<FuelType, number>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(MANUAL_STOCK_KEY);
      if (storedItems) {
        setManualStock(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse manual fuel stock from localStorage", error);
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

  const calculatedStock = useMemo(() => {
    if (!transactionsLoaded || !purchasesLoaded || !purchaseReturnsLoaded) {
      return DEFAULT_FUEL_STOCK;
    }

    const stock = { ...DEFAULT_FUEL_STOCK };

    for (const fuelType in stock) {
        const ft = fuelType as FuelType;

        const totalSold = transactions
            .filter(t => t.fuelType === ft)
            .reduce((sum, t) => sum + t.volume, 0);

        const totalPurchased = purchases
            .filter(p => p.fuelType === ft)
            .reduce((sum, p) => sum + p.volume, 0);

        const totalReturned = purchaseReturns
            .filter(pr => pr.fuelType === ft)
            .reduce((sum, pr) => sum + pr.volume, 0);
        
        stock[ft] = stock[ft] + totalPurchased - totalSold - totalReturned;
    }
    
    return stock;
  }, [transactions, purchases, purchaseReturns, transactionsLoaded, purchasesLoaded, purchaseReturnsLoaded]);

  const fuelStock = useMemo(() => {
    return {
      ...calculatedStock,
      ...manualStock,
    };
  }, [calculatedStock, manualStock]);

  const setFuelStock = useCallback((fuelType: FuelType, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    setManualStock(prev => ({
      ...prev,
      [fuelType]: newStock,
    }));
  }, []);

  const clearFuelStock = useCallback(() => {
    setManualStock({});
    try {
      localStorage.removeItem(MANUAL_STOCK_KEY);
    } catch (error) {
      console.error("Failed to remove manual fuel stock from localStorage", error);
    }
  }, []);

  return { fuelStock, setFuelStock, clearFuelStock, isLoaded: isLoaded && transactionsLoaded && purchasesLoaded && purchaseReturnsLoaded };
}
