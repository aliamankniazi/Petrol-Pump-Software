
'use client';

import { useCallback } from 'react';
import { ref, remove } from 'firebase/database';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase-client';
import { useInstitution } from './use-institution';

export function useSettings() {
  const { user } = useAuth();
  const { currentInstitution, clearCurrentInstitution: clearFromContext } = useInstitution();

  const clearAllData = useCallback(async () => {
    if (!user || !currentInstitution) {
        throw new Error("No authenticated user or institution selected to clear data for.");
    }
    
    // Allow owner to clear all data
    if (user.uid !== currentInstitution.ownerId) {
        throw new Error("Permission denied. Only the institution owner can clear all data.");
    }
    if (!db) {
      throw new Error("Database not initialized.");
    }

    // This is a very destructive operation. It removes the entire institution node.
    const institutionRootRef = ref(db, `institutions/${currentInstitution.id}`);
    try {
      await remove(institutionRootRef);
      clearFromContext(); // Also clear from the context to force re-selection
      console.log(`All data for institution ${currentInstitution.name} has been cleared.`);
    } catch (error) {
      console.error(`Failed to clear data for institution ${currentInstitution.id}:`, error);
      throw error;
    }
  }, [user, currentInstitution, clearFromContext]);

  return {
    clearAllData,
  };
}
