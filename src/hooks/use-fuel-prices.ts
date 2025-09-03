
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

// DEPRECATED: This hook is no longer in use. Product prices are now managed directly
// on the product object via use-products.ts. This file is kept for archival purposes
// and to avoid breaking any lingering imports, but it should be removed in the future.

const COLLECTION_NAME = 'settings';
const DOC_ID = 'fuel-prices';

interface FuelPriceDoc {
    id: string;
    prices: Record<FuelType, number>;
}

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelPrices() {
  const { data, updateDoc, addDoc, loading } = useDatabaseCollection<FuelPriceDoc>(COLLECTION_NAME);
  
  const fuelPricesData = useMemo(() => {
    const doc = data.find(d => d.id === DOC_ID);
    return doc ? doc.prices : DEFAULT_FUEL_PRICES;
  }, [data]);

  const updateFuelPrice = useCallback((fuelType: FuelType, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    
    const doc = data.find(d => d.id === DOC_ID);
    const updatedPrices = { ...(doc?.prices || DEFAULT_FUEL_PRICES), [fuelType]: newPrice };
    
    if (doc) {
        updateDoc(DOC_ID, { prices: updatedPrices });
    } else {
        addDoc({ id: DOC_ID, prices: updatedPrices } as any);
    }

  }, [data, updateDoc, addDoc]);

  return { 
    fuelPrices: fuelPricesData, 
    updateFuelPrice, 
    isLoaded: !loading 
  };
}
