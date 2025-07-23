
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useInstitution } from './use-institution.tsx';

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
  const { currentInstitution } = useInstitution();
  const { data, updateDoc, addDoc, loading } = useDatabaseCollection<FuelPriceDoc>(COLLECTION_NAME, currentInstitution?.id || null);
  
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
        addDoc({ prices: updatedPrices }, DOC_ID);
    }

  }, [data, updateDoc, addDoc]);

  return { 
    fuelPrices: fuelPricesData, 
    updateFuelPrice, 
    isLoaded: !loading 
  };
}
