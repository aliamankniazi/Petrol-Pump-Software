
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TankReading } from '@/lib/types';

const STORAGE_KEY = 'pumppal-tank-readings';

export function useTankReadings() {
  const [tankReadings, setTankReadings] = useState<TankReading[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setTankReadings(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse tank readings from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tankReadings));
      } catch (error) {
        console.error("Failed to save tank readings to localStorage", error);
      }
    }
  }, [tankReadings, isLoaded]);

  const addTankReading = useCallback((reading: Omit<TankReading, 'id' | 'timestamp'>) => {
    setTankReadings(prev => [
      { ...reading, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const clearTankReadings = useCallback(() => {
    setTankReadings([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { tankReadings, addTankReading, clearTankReadings, isLoaded };
}
