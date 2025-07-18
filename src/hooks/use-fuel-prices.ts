'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FuelType } from '@/lib/types';

const STORAGE_KEY = 'pumppal-fuel-prices';

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 275.98,
  'Premium': 285.50,
  'Diesel': 282.44,
};

export function useFuelPrices() {
  const [fuelPrices, setFuelPrices] = useState<Record<FuelType, number>>({...DEFAULT_FUEL_PRICES});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setFuelPrices(JSON.parse(storedItems));
      } else {
        setFuelPrices(DEFAULT_FUEL_PRICES);
      }
    } catch (error) {
      console.error("Failed to parse fuel prices from localStorage", error);
      setFuelPrices(DEFAULT_FUEL_PRICES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fuelPrices));
      } catch (error) {
        console.error("Failed to save fuel prices to localStorage", error);
      }
    }
  }, [fuelPrices, isLoaded]);
  
  const updateFuelPrice = useCallback((fuelType: FuelType, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setFuelPrices(prev => ({
      ...prev,
      [fuelType]: newPrice,
    }));
  }, []);

  const clearFuelPrices = useCallback(() => {
    setFuelPrices({...DEFAULT_FUEL_PRICES});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove fuel prices from localStorage", error);
    }
  }, []);

  return { fuelPrices, updateFuelPrice, clearFuelPrices, isLoaded };
}
