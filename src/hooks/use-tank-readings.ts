
'use client';

import { useCallback } from 'react';
import type { TankReading } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';

const COLLECTION_NAME = 'tank-readings';

export function useTankReadings() {
  const { data: tankReadings, addDoc, loading } = useDatabaseCollection<TankReading>(COLLECTION_NAME);

  const addTankReading = useCallback((reading: Omit<TankReading, 'id'>) => {
    addDoc(reading);
  }, [addDoc]);

  return { 
    tankReadings: tankReadings || [], 
    addTankReading, 
    isLoaded: !loading 
  };
}
