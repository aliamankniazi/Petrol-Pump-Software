
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from './use-auth';

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
  const { user } = useAuth(); // Use the auth hook

  const collectionRef = useMemo(() => {
    if (!isFirebaseConfigured() || !db || !user) {
        return null;
    }
    try {
        return ref(db, collectionName);
    } catch (error) {
        console.error("Error creating database reference:", error);
        return null;
    }
  }, [collectionName, user]);


  useEffect(() => {
    if (!collectionRef) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onValue(collectionRef, (snapshot) => {
      const dataArray: (T & {id: string})[] = [];
      if (snapshot.exists()) {
        const fetchedData = snapshot.val();
        Object.keys(fetchedData).forEach(key => {
          dataArray.push({
            ...fetchedData[key],
            id: key,
          });
        });
      }
      
      dataArray.sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampB - timestampA; // Sort newest first directly
      });
      
      setData(dataArray);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, collectionRef]);

  const addDoc = useCallback(async (newData: T, docId?: string): Promise<T & { id: string }> => {
    if (!db || !user) {
      throw new Error("Database not configured or user not authenticated.");
    }

    let docRef: DatabaseReference;
    let newId: string;

    if (docId) {
      // Use the provided ID
      newId = docId;
      docRef = ref(db, `${collectionName}/${newId}`);
    } else {
      // Generate a new ID
      const collectionRefForPush = ref(db, collectionName);
      const newPushRef = push(collectionRefForPush);
      docRef = newPushRef;
      newId = newPushRef.key!;
    }
      
    const docToWrite = { ...newData };
    
    await set(docRef, docToWrite);
    return { ...newData, id: newId };

  }, [collectionName, user]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<T>) => {
     if (!db || !user) return;
     const path = `${collectionName}/${id}`;
     
    const docRef = ref(db, path);
    await update(docRef, updatedData);
  }, [collectionName, user]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!db || !user) return;
    const path = `${collectionName}/${id}`;
    const docRef = ref(db, path);
    await remove(docRef);
  }, [collectionName, user]);

  const clearCollection = useCallback(async () => {
    if (!db || !user) return;
    const collectionRefForClear = ref(db, collectionName);
    await remove(collectionRefForClear);
  }, [collectionName, user]);

  return { data, addDoc, updateDoc, deleteDoc, clearCollection, loading };
}
