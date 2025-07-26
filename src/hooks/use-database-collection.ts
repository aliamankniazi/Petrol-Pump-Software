
'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
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
import { DataContext } from './use-database';

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
  const { institutionId } = useContext(DataContext);


  useEffect(() => {
    if (!isFirebaseConfigured() || !db || !institutionId ) {
      setLoading(false);
      setData([]);
      return () => {};
    }

    setLoading(true);
    let collectionRef: DatabaseReference;
    try {
      const path = `institutions/${institutionId}/${collectionName}`;
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
    if (!db || !institutionId) throw new Error("DB not initialized or institution not set");
    
    const path = `institutions/${institutionId}/${collectionName}`;
    const timestamp = Date.now();
    const dataWithTimestamp = { ...newData, timestamp };

    if (docId) {
      const docRef = ref(db, `${path}/${docId}`);
      await set(docRef, dataWithTimestamp);
      return { id: docId, ...dataWithTimestamp } as T;
    } else {
      const collectionRef = ref(db, path);
      const newDocRef = push(collectionRef);
      await set(newDocRef, dataWithTimestamp);
      return { id: newDocRef.key!, ...dataWithTimestamp } as T;
    }
  }, [institutionId, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
     if (!db || !institutionId) return;
     const path = `institutions/${institutionId}/${collectionName}/${id}`;
     
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [institutionId, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!db || !institutionId) return;
    const path = `institutions/${institutionId}/${collectionName}/${id}`;
    const docRef = ref(db, path);
    await remove(docRef);
  }, [institutionId, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
