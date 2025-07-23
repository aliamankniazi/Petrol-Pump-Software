
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
  timestamp?: number;
  [key: string]: any;
}

export function useDatabaseCollection<T extends DbDoc>(
  collectionName: string,
  institutionId: string | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !db ) {
      setLoading(false);
      setData([]);
      return () => {};
    }
    
    // For collections that are not specific to an institution, like userMappings
    if (collectionName && !institutionId && collectionName !== 'userMappings') {
      setLoading(false);
      setData([]);
      return () => {};
    }

    setLoading(true);
    let collectionRef: DatabaseReference;
    try {
      const path = institutionId ? `institutions/${institutionId}/${collectionName}` : collectionName;
      collectionRef = ref(db, path);
    } catch (error) {
      console.error("Error creating database reference:", error);
      setLoading(false);
      return () => {};
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
  }, [institutionId, collectionName]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string): Promise<T> => {
    if (!db) throw new Error("DB not initialized");
    
    let path = collectionName;
    if (institutionId) {
      path = `institutions/${institutionId}/${collectionName}`;
    }

    if (!institutionId && collectionName !== 'userMappings') {
        throw new Error("Cannot add document without an institutionId for this collection.");
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
  }, [institutionId, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
     if (!db) return;
     let path = collectionName;
     if (institutionId) {
       path = `institutions/${institutionId}/${collectionName}/${id}`;
     } else {
       path = `${collectionName}/${id}`;
     }
     
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [institutionId, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!db) return;
    let path = collectionName;
     if (institutionId) {
       path = `institutions/${institutionId}/${collectionName}/${id}`;
     } else {
       path = `${collectionName}/${id}`;
     }
    const docRef = ref(db, path);
    await remove(docRef);
  }, [institutionId, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
