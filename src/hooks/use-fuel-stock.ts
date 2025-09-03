
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

// DEPRECATED: This hook is no longer in use. Product stock is now managed directly
// on the product object via use-products.ts. This file is kept for archival purposes
// and to avoid breaking any lingering imports, but it should be removed in the future.

const COLLECTION_NAME = 'settings';
const DOC_ID = 'fuel-stock';

interface FuelStockDoc {
    id: string;
    stock: Record<FuelType, number>;
}

const DEFAULT_FUEL_STOCK: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelStock() {
  const { data, updateDoc, addDoc, loading } = useDatabaseCollection<FuelStockDoc>(COLLECTION_NAME);

  const fuelStock = useMemo(() => {
    const doc = data.find(d => d.id === DOC_ID);
    return doc ? doc.stock : DEFAULT_FUEL_STOCK;
  }, [data]);

  const setFuelStock = useCallback((fuelType: FuelType, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    
    const doc = data.find(d => d.id === DOC_ID);
    const updatedStock = { ...(doc?.stock || DEFAULT_FUEL_STOCK), [fuelType]: newStock };
    
    if (doc) {
      updateDoc(DOC_ID, { stock: updatedStock });
    } else {
      addDoc({ id: DOC_ID, stock: updatedStock } as any);
    }
  }, [data, updateDoc, addDoc]);

  return { fuelStock, setFuelStock, isLoaded: !loading };
}
