
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  onValue,
  push,
  update,
  remove,
  set,
  serverTimestamp,
  type DatabaseReference,
} from 'firebase/database';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';
import { useAuth } from './use-auth';

interface DbDoc {
  id: string;
  [key: string]: any;
}


// This hook now requires a rootUserId to function.
// The rootUserId should be the UID of the super-admin.
export function useDatabaseCollection<T extends DbDoc>(collectionName: string, rootUserId?: string | null, fetchAll = false) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // If no rootUserId is provided (and we are not in fetchAll mode), we can't fetch data.
    if ((!rootUserId && !fetchAll) || !isFirebaseConfigured()) {
      setLoading(false);
      setData([]);
      return;
    }

    if (!db) {
        console.error("Database not initialized.");
        setLoading(false);
        return;
    }

    let collectionRef: DatabaseReference;
    try {
      // If fetchAll is true, get the root of 'users', otherwise get the user-specific collection.
      const path = fetchAll ? 'users' : `users/${rootUserId}/${collectionName}`;
      collectionRef = ref(db, path);
    } catch (error) {
      console.error("Error creating database reference:", error);
      setLoading(false);
      return;
    }

    const unsubscribe = onValue(collectionRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        
        let dataArray: T[] = [];

        if (fetchAll) {
            // Data is nested under user UIDs, e.g., /users/{uid}/user-roles/{uid}
            Object.keys(fetchedData).forEach(uid => {
                const userData = fetchedData[uid];
                if (userData && userData[collectionName]) {
                    const items = userData[collectionName];
                     Object.keys(items).forEach(key => {
                        dataArray.push({
                            id: key,
                            ...items[key]
                        } as T)
                     });
                }
            });
        } else {
             dataArray = Object.keys(fetchedData).map(key => ({
                id: key,
                ...fetchedData[key],
            })) as T[];
        }
        
        dataArray.sort((a, b) => {
          const timestampA = a.timestamp || 0;
          const timestampB = b.timestamp || 0;
          return timestampB - timestampA;
        });

        setData(dataArray);
      } else {
        setData([]);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [rootUserId, collectionName, fetchAll]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string) => {
    // We need the root user ID to know where to write. If it's not provided, use the current user's UID.
    // This is crucial for the very first user signup.
    const effectiveRootId = rootUserId || user?.uid;
    if (!effectiveRootId || !db || !isFirebaseConfigured()) throw new Error("Not authenticated or DB not initialized");
    
    const dataWithTimestamp = { ...newData, timestamp: serverTimestamp() };
    const collectionRef = ref(db, `users/${effectiveRootId}/${collectionName}`);

    if (docId) {
      const docRef = ref(db, `users/${effectiveRootId}/${collectionName}/${docId}`);
      await set(docRef, dataWithTimestamp);
      return { id: docId, ...newData, timestamp: Date.now() } as T;
    } else {
      const newDocRef = push(collectionRef);
      await set(newDocRef, dataWithTimestamp);
      return { id: newDocRef.key!, ...newData, timestamp: Date.now() } as T;
    }
  }, [rootUserId, user, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
    const effectiveRootId = rootUserId || user?.uid;
    if (!effectiveRootId || !db || !isFirebaseConfigured()) return;
    const docRef = ref(db, `users/${effectiveRootId}/${collectionName}/${id}`);
    await update(docRef, updatedData);
  }, [rootUserId, user, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    const effectiveRootId = rootUserId || user?.uid;
    if (!effectiveRootId || !db || !isFirebaseConfigured()) return;
    const docRef = ref(db, `users/${effectiveRootId}/${collectionName}/${id}`);
    await remove(docRef);
  }, [rootUserId, user, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
