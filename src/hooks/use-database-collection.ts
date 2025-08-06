
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  onValue,
  push,
  update,
  remove,
  set,
  type DatabaseReference,
} from 'firebase/database';
import { db, isFirebaseConfigured } from '@/lib/firebase-client';

interface DbDoc {
  id: string;
  timestamp?: string; // Timestamps should be strings (ISO 8601)
  [key: string]: any;
}

export function useDatabaseCollection<T extends DbDoc>(
  collectionName: string,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
      console.warn(`Firebase not configured, skipping fetch for ${collectionName}.`);
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    let collectionRef: DatabaseReference;
    try {
      collectionRef = ref(db, collectionName);
    } catch (error) {
      console.error("Error creating database reference:", error);
      setLoading(false);
      return;
    }

    const unsubscribe = onValue(collectionRef, (snapshot) => {
      const dataArray: T[] = [];
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        Object.keys(fetchedData).forEach(key => {
          dataArray.push({
            id: key,
            ...fetchedData[key],
          });
        });
      }
      
      dataArray.sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampB - timestampA;
      });

      setData(dataArray);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, db]); // Added db to dependency array

  const addDoc = useCallback(async (newData: Omit<T, 'id'>, docId?: string) => {
    if (!db) {
      throw new Error("Database not configured.");
    }
    
    const docRef = docId ? ref(db, `${collectionName}/${docId}`) : push(ref(db, collectionName));
    
    await set(docRef, newData);

    // No need to manually update state, onValue listener will handle it.
  }, [collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
     if (!db) return;
     const path = `${collectionName}/${id}`;
     
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!db) return;
    const path = `${collectionName}/${id}`;
    const docRef = ref(db, path);
    await remove(docRef);
  }, [collectionName]);

  const clearCollection = useCallback(async () => {
    if (!db) return;
    const collectionRef = ref(db, collectionName);
    await remove(collectionRef);
  }, [collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, clearCollection, loading };
}
