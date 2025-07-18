'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FuelType } from '@/lib/types';

const STORAGE_KEY = 'pumppal-fuel-prices';

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  'Unleaded': 1.80,
  'Premium': 2.10,
  'Diesel': 2.00,
};

export function useFuelPrices() {
  const [fuelPrices, setFuelPrices] = useState<Record<FuelType, number>>(DEFAULT_FUEL_PRICES);
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

  return { fuelPrices, updateFuelPrice, isLoaded };
}
