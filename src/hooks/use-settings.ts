
'use client';

import { useCallback, useContext } from 'react';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import { DataContext } from './use-database';


export function useSettings() {
  const { institutionId } = useContext(DataContext);

  const clearAllData = useCallback(async () => {
    if (!institutionId) {
        throw new Error("No institution selected to clear data for.");
    }

    if (!db) {
      throw new Error("Database not initialized.");
    }

    const institutionRootRef = ref(db, `institutions/${institutionId}`);
    try {
      await remove(institutionRootRef);
      console.log(`All data for institution ${institutionId} has been cleared.`);
      // Optionally, force a page reload to reset state
      window.location.reload();
    } catch (error) {
      console.error(`Failed to clear data for institution ${institutionId}:`, error);
      throw error;
    }
  }, [institutionId]);

  return {
    clearAllData,
  };
}
