
'use client';

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
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
  const institutionIdRef = useRef(institutionId);

  useEffect(() => {
    institutionIdRef.current = institutionId;
  }, [institutionId]);


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
    const currentInstitutionId = institutionIdRef.current;
    if (!db || !currentInstitutionId) {
      console.error("Database or institution ID not available for addDoc.");
      throw new Error("Cannot save data: No active institution selected.");
    }

    const path = `institutions/${currentInstitutionId}/${collectionName}`;
    const timestamp = Date.now();
    const dataWithTimestamp = { ...newData, timestamp };

    const docRef = docId ? ref(db, `${path}/${docId}`) : push(ref(db, path));
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
     const currentInstitutionId = institutionIdRef.current;
     if (!db || !currentInstitutionId) return;
     const path = `institutions/${currentInstitutionId}/${collectionName}/${id}`;
     
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    const currentInstitutionId = institutionIdRef.current;
    if (!db || !currentInstitutionId) return;
    const path = `institutions/${currentInstitutionId}/${collectionName}/${id}`;
    const docRef = ref(db, path);
    await remove(docRef);
  }, [collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
