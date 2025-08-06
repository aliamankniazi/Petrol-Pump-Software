
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
  timestamp?: number;
  [key: string]: any;
}

export function useDatabaseCollection<T extends DbDoc>(
  collectionName: string,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !db) {
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
  }, [collectionName]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string): Promise<T> => {
    if (!db) {
      throw new Error("Database not configured.");
    }

    const timestamp = Date.now();
    const dataWithTimestamp = { ...newData, timestamp };

    const docRef = docId ? ref(db, `${collectionName}/${docId}`) : push(ref(db, collectionName));
    const finalId = docId || docRef.key;

    if (!finalId) {
        throw new Error("Failed to generate a document ID.");
    }
    
    await set(docRef, dataWithTimestamp);

    const finalDoc = { id: finalId, ...dataWithTimestamp } as T;
    
    setData(prev => [finalDoc, ...prev].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    
    return finalDoc;
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
    setData([]);
  }, [collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, clearCollection, loading };
}
