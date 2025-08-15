

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
  timestamp: string; 
  [key: string]: any;
}

export function useDatabaseCollection<T extends Omit<DbDoc, 'id'>>(
  collectionName: string,
) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
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
      const dataArray: any[] = [];
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        Object.keys(fetchedData).forEach(key => {
          dataArray.push({
            ...fetchedData[key],
            id: key, // Ensure the key from the snapshot is the ID
          });
        });
      }
      
      // DEPRECATED - This sort order was causing issues. Data is now sorted by timestamp.
      // dataArray.sort((a, b) => {
      //   const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      //   const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      //   return timestampB - timestampA;
      // });
      
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
  }, [collectionName]);

  const addDoc = useCallback(async (newData: T, docId?: string): Promise<T & { id: string }> => {
    if (!db) {
      throw new Error("Database not configured.");
    }

    let docRef: DatabaseReference;
    let newId: string;

    if (docId) {
      // Use the provided ID
      newId = docId;
      docRef = ref(db, `${collectionName}/${newId}`);
    } else {
      // Generate a new ID
      const collectionRef = ref(db, collectionName);
      const newPushRef = push(collectionRef);
      docRef = newPushRef;
      newId = newPushRef.key!;
    }
      
    const docToWrite = { ...newData };
    
    await set(docRef, docToWrite);
    return { ...newData, id: newId };

  }, [collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<T>) => {
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
