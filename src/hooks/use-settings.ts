
'use client';

import { useCallback } from 'react';
import { ref, remove } from 'firebase/database';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase-client';
import { useRoles } from './use-roles';

export function useSettings() {
  const { user } = useAuth();
  const { superAdminUid } = useRoles();

  const clearAllData = useCallback(async () => {
    if (!user || !superAdminUid) {
        console.error("No authenticated user or super admin found to clear data for.");
        return;
    }
    if (!db) {
      console.error("Database not initialized.");
      return;
    }

    const userRootRef = ref(db, `users/${superAdminUid}`);
    try {
      await remove(userRootRef);
      console.log(`All data for user ${superAdminUid} has been cleared.`);
    } catch (error) {
      console.error(`Failed to clear data for user ${superAdminUid}:`, error);
    }
  }, [user, superAdminUid]);

  return {
    clearAllData,
  };
}
