
'use client';

import { useCallback, useMemo } from 'react';
import type { FuelType } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'fuel-stock';

interface FuelStockDoc {
    stock: Record<FuelType, number>;
}

const DEFAULT_FUEL_STOCK: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelStock() {
  const { data, updateDoc, loading } = useFirestoreCollection<FuelStockDoc>(COLLECTION_NAME);

  const fuelStock = useMemo(() => {
    const doc = data.find(d => d.id === DOC_ID);
    return doc ? doc.stock : DEFAULT_FUEL_STOCK;
  }, [data]);

  const setFuelStock = useCallback((fuelType: FuelType, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    
    const doc = data.find(d => d.id === DOC_ID);
    const updatedStock = { ...(doc?.stock || DEFAULT_FUEL_STOCK), [fuelType]: newStock };
    updateDoc(DOC_ID, { stock: updatedStock });
  }, [data, updateDoc]);

  return { fuelStock, setFuelStock, isLoaded: !loading };
}
