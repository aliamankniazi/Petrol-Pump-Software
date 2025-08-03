
'use client';

import { useCallback } from 'react';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase-client';
import { useRoles } from './use-roles';


export function useSettings() {
  const { currentInstitution, getUsersForInstitution } = useRoles();
  const institutionId = currentInstitution?.id;

  const clearAllData = useCallback(async () => {
    if (!institutionId) {
        throw new Error("No institution selected to clear data for.");
    }

    if (!db) {
      throw new Error("Database not initialized.");
    }

    try {
      // 1. Get all users associated with this institution
      const usersInInstitution = await getUsersForInstitution(institutionId);

      // 2. Remove the userMappings for each of those users
      const mappingRemovalPromises = usersInInstitution.map(user => {
        const userMappingRef = ref(db, `userMappings/${user.uid}/${institutionId}`);
        return remove(userMappingRef);
      });
      await Promise.all(mappingRemovalPromises);
      console.log(`Cleared ${usersInInstitution.length} user mappings for institution ${institutionId}.`);
      
      // 3. Remove the institution's data itself
      const institutionRootRef = ref(db, `institutions/${institutionId}`);
      await remove(institutionRootRef);
      console.log(`All data for institution ${institutionId} has been cleared.`);
      
      // 4. Force a page reload to reset state
      window.location.reload();
      
    } catch (error) {
      console.error(`Failed to clear data for institution ${institutionId}:`, error);
      throw error;
    }
  }, [institutionId, getUsersForInstitution]);

  return {
    clearAllData,
  };
}
