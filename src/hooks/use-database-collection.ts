
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

interface DbDoc {
  id: string;
  [key: string]: any;
}

// This hook now requires a rootUserId to function.
// The rootUserId should be the UID of the super-admin.
export function useDatabaseCollection<T extends DbDoc>(collectionName: string, rootUserId?: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no rootUserId is provided, we can't fetch data, so we reset.
    if (!rootUserId || !isFirebaseConfigured()) {
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
      collectionRef = ref(db, `users/${rootUserId}/${collectionName}`);
    } catch (error) {
      console.error("Error creating database reference:", error);
      setLoading(false);
      return;
    }

    const unsubscribe = onValue(collectionRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        const dataArray = Object.keys(fetchedData).map(key => ({
          id: key,
          ...fetchedData[key],
        })) as T[];
        
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
  }, [rootUserId, collectionName]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string) => {
    if (!rootUserId || !db || !isFirebaseConfigured()) throw new Error("Not authenticated or DB not initialized");
    
    const dataWithTimestamp = { ...newData, timestamp: serverTimestamp() };
    const collectionRef = ref(db, `users/${rootUserId}/${collectionName}`);

    if (docId) {
      const docRef = ref(db, `users/${rootUserId}/${collectionName}/${docId}`);
      await set(docRef, dataWithTimestamp);
      return { id: docId, ...newData, timestamp: Date.now() } as T;
    } else {
      const newDocRef = push(collectionRef);
      await set(newDocRef, dataWithTimestamp);
      return { id: newDocRef.key!, ...newData, timestamp: Date.now() } as T;
    }
  }, [rootUserId, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
    if (!rootUserId || !db || !isFirebaseConfigured()) return;
    const docRef = ref(db, `users/${rootUserId}/${collectionName}/${id}`);
    await update(docRef, updatedData);
  }, [rootUserId, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!rootUserId || !db || !isFirebaseConfigured()) return;
    const docRef = ref(db, `users/${rootUserId}/${collectionName}/${id}`);
    await remove(docRef);
  }, [rootUserId, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
