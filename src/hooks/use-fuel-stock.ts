
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useTransactions } from './use-transactions';
import { usePurchases } from './use-purchases';
import { usePurchaseReturns } from './use-purchase-returns';
import { useLocalStorage } from './use-local-storage';

const MANUAL_STOCK_KEY = 'manual-fuel-stock';
const INITIAL_STOCK_KEY = 'initial-fuel-stock';

const DEFAULT_INITIAL_STOCK: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelStock() {
  const { transactions, isLoaded: transactionsLoaded } = useTransactions();
  const { purchases, isLoaded: purchasesLoaded } = usePurchases();
  const { purchaseReturns, isLoaded: purchaseReturnsLoaded } = usePurchaseReturns();
  
  const { data: manualStock, setData: setManualStock, isLoaded: manualStockLoaded, clearDataForUser: clearManualStock } = useLocalStorage<Partial<Record<FuelType, { value: number; timestamp: string }>>>(MANUAL_STOCK_KEY, {});
  const { data: initialStock, setData: setInitialStock, isLoaded: initialStockLoaded, clearDataForUser: clearInitialStock } = useLocalStorage<Record<FuelType, number>>(INITIAL_STOCK_KEY, DEFAULT_INITIAL_STOCK);

  const isLoaded = transactionsLoaded && purchasesLoaded && purchaseReturnsLoaded && manualStockLoaded && initialStockLoaded;

  const fuelStock = useMemo(() => {
    const currentInitialStock = initialStock || DEFAULT_INITIAL_STOCK;
    if (!isLoaded) {
      return currentInitialStock;
    }

    const stock = { ...currentInitialStock };
    const currentManualStock = manualStock || {};

    for (const fuelType in stock) {
        const ft = fuelType as FuelType;

        const manualAdjustment = currentManualStock[ft];
        
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
            
            stock[ft] = (currentInitialStock[ft] || 0) + totalPurchased - totalSold - totalReturned;
        }
    }
    
    return stock;
  }, [initialStock, manualStock, transactions, purchases, purchaseReturns, isLoaded]);

  const setFuelStock = useCallback((fuelType: FuelType, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    
    setManualStock(prev => ({
      ...(prev || {}),
      [fuelType]: { value: newStock, timestamp: new Date().toISOString() },
    }));
  }, [setManualStock]);

  const clearFuelStock = useCallback((userId: string) => {
    clearManualStock(userId);
    clearInitialStock(userId);
  }, [clearManualStock, clearInitialStock]);

  return { fuelStock, setFuelStock, clearFuelStock, isLoaded };
}
