
'use client';

import { useCallback } from 'react';
import { getDatabase, ref, remove } from 'firebase/database';
import { auth, db } from '@/lib/firebase';

// This hook provides a function to clear all data for the current user.
// It is a destructive operation and should be used with caution.
export function useSettings() {

  const clearAllDataForUser = useCallback(async (userId: string) => {
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    const userRootRef = ref(db, `users/${userId}`);
    try {
      await remove(userRootRef);
      console.log(`All data for user ${userId} has been cleared.`);
    } catch (error) {
      console.error(`Failed to clear data for user ${userId}:`, error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    if (!auth?.currentUser) {
        console.error("No authenticated user found to clear data for.");
        return;
    }
    await clearAllDataForUser(auth.currentUser.uid);
  }, [clearAllDataForUser]);

  return {
    clearAllData,
    clearAllDataForUser,
  };
}
