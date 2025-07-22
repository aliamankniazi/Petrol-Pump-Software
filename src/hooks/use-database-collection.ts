
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

export function useDatabaseCollection<T extends DbDoc>(
  collectionName: string,
  institutionId: string | null,
  options?: { allInstitutions?: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
      setLoading(false);
      return;
    }
    
    if (!institutionId && !options?.allInstitutions) {
      setLoading(false);
      setData([]);
      return;
    }

    let collectionRef: DatabaseReference;
    try {
      const path = options?.allInstitutions
        ? collectionName
        : `institutions/${institutionId}/${collectionName}`;
      collectionRef = ref(db, path);
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
          } as T);
        });
      }
      
      dataArray.sort((a, b) => {
        const timestampA = a.timestamp || 0;
        const timestampB = b.timestamp || 0;
        return (typeof timestampB === 'number' && typeof timestampA === 'number') ? timestampB - timestampA : 0;
      });

      setData(dataArray);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [institutionId, collectionName, options?.allInstitutions]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string) => {
    if (!db) throw new Error("DB not initialized");

    const path = options?.allInstitutions
        ? collectionName
        : `institutions/${institutionId}/${collectionName}`;

    if (!institutionId && !options?.allInstitutions) {
        throw new Error("Cannot add document without an institutionId unless 'allInstitutions' is true.");
    }
    
    const dataWithTimestamp = { ...newData, timestamp: serverTimestamp() };

    if (docId) {
      const docRef = ref(db, `${path}/${docId}`);
      await set(docRef, dataWithTimestamp);
      return { id: docId, ...newData, timestamp: Date.now() } as T;
    } else {
      const collectionRef = ref(db, path);
      const newDocRef = push(collectionRef);
      await set(newDocRef, dataWithTimestamp);
      return { id: newDocRef.key!, ...newData, timestamp: Date.now() } as T;
    }
  }, [institutionId, collectionName, options?.allInstitutions]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
     if (!db || (!institutionId && !options?.allInstitutions)) return;
     const path = options?.allInstitutions
        ? `${collectionName}/${id}`
        : `institutions/${institutionId}/${collectionName}/${id}`;
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [institutionId, collectionName, options?.allInstitutions]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!db || (!institutionId && !options?.allInstitutions)) return;
    const path = options?.allInstitutions
        ? `${collectionName}/${id}`
        : `institutions/${institutionId}/${collectionName}/${id}`;
    const docRef = ref(db, path);
    await remove(docRef);
  }, [institutionId, collectionName, options?.allInstitutions]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
