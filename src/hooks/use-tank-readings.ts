
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TankReading } from '@/lib/types';

const STORAGE_KEY = 'pumppal-tank-readings';

export function useTankReadings() {
  const [tankReadings, setTankReadings] = useState<TankReading[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
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
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (isLoaded) {
      try {
        const sortedReadings = [...tankReadings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedReadings));
      } catch (error) {
        console.error("Failed to save tank readings to localStorage", error);
      }
    }
  }, [tankReadings, isLoaded]);

  const addTankReading = useCallback((reading: Omit<TankReading, 'id'>) => {
    setTankReadings(prev => {
        const newReadings = [
            { ...reading, id: crypto.randomUUID() },
            ...prev,
        ];
        return newReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, []);

  const clearTankReadings = useCallback(() => {
    setTankReadings([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { tankReadings, addTankReading, clearTankReadings, isLoaded };
}
