
'use client';

import { useCallback } from 'react';
import { ref, remove, getDatabase } from 'firebase/database';
import { useAuth } from './use-auth';
import { firebaseConfig } from '@/lib/firebase';
import { getApps, initializeApp } from 'firebase/app';


let db: import('firebase/database').Database | null = null;
if (firebaseConfig.apiKey) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getDatabase(app);
}

// This hook provides a function to clear all data for the current user.
// It is a destructive operation and should be used with caution.
export function useSettings() {
  const { user } = useAuth();

  const clearAllData = useCallback(async () => {
    if (!user) {
        console.error("No authenticated user found to clear data for.");
        return;
    }
    if (!db) {
      console.error("Database not initialized.");
      return;
    }
    const userRootRef = ref(db, `users/${user.uid}`);
    try {
      await remove(userRootRef);
      console.log(`All data for user ${user.uid} has been cleared.`);
    } catch (error) {
      console.error(`Failed to clear data for user ${user.uid}:`, error);
    }
  }, [user]);

  return {
    clearAllData,
  };
}
