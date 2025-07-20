
'use client';

import { useCallback } from 'react';
import type { TankReading } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'tank-readings';

export function useTankReadings() {
  const { data: tankReadings, setData: setTankReadings, isLoaded } = useLocalStorage<TankReading[]>(STORAGE_KEY, []);

  const addTankReading = useCallback((reading: Omit<TankReading, 'id'>) => {
    setTankReadings(prev => {
        const newReadings = [
            { ...reading, id: crypto.randomUUID() },
            ...(prev || []),
        ];
        return newReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [setTankReadings]);

  const clearTankReadings = useCallback(() => {
    setTankReadings([]);
  }, [setTankReadings]);

  return { tankReadings: tankReadings || [], addTankReading, clearTankReadings, isLoaded };
}
