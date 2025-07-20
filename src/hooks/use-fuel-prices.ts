
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'fuel-prices';

interface FuelPriceDoc {
    prices: Record<FuelType, number>;
}

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelPrices() {
  const { data, updateDoc, loading } = useFirestoreCollection<FuelPriceDoc>(COLLECTION_NAME);
  
  const fuelPricesData = useMemo(() => {
    const doc = data.find(d => d.id === DOC_ID);
    return doc ? doc.prices : DEFAULT_FUEL_PRICES;
  }, [data]);

  const updateFuelPrice = useCallback((fuelType: FuelType, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    
    const doc = data.find(d => d.id === DOC_ID);
    const updatedPrices = { ...(doc?.prices || DEFAULT_FUEL_PRICES), [fuelType]: newPrice };
    updateDoc(DOC_ID, { prices: updatedPrices });

  }, [data, updateDoc]);

  return { 
    fuelPrices: fuelPricesData, 
    updateFuelPrice, 
    isLoaded: !loading 
  };
}
