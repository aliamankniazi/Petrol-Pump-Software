
'use client';

import { useCallback } from 'react';
import type { FuelType } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'fuel-prices';

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 0,
  'Premium': 0,
  'Diesel': 0,
};

export function useFuelPrices() {
  const { data: fuelPrices, setData: setFuelPrices, isLoaded } = useLocalStorage<Record<FuelType, number>>(STORAGE_KEY, DEFAULT_FUEL_PRICES);

  const updateFuelPrice = useCallback((fuelType: FuelType, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setFuelPrices(prev => ({
      ...(prev || DEFAULT_FUEL_PRICES),
      [fuelType]: newPrice,
    }));
  }, [setFuelPrices]);

  const clearFuelPrices = useCallback(() => {
    setFuelPrices(DEFAULT_FUEL_PRICES);
  }, [setFuelPrices]);

  return { fuelPrices: fuelPrices || DEFAULT_FUEL_PRICES, updateFuelPrice, clearFuelPrices, isLoaded };
}
