
'use client';

import { useCallback } from 'react';
import type { TankReading } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'tank-readings';

export function useTankReadings() {
  const { currentInstitution } = useRoles();
  const { data: tankReadings, addDoc, loading } = useDatabaseCollection<TankReading>(COLLECTION_NAME, currentInstitution?.id || null);

  const addTankReading = useCallback((reading: Omit<TankReading, 'id'>) => {
    addDoc(reading);
  }, [addDoc]);

  return { 
    tankReadings: tankReadings || [], 
    addTankReading, 
    isLoaded: !loading 
  };
}
