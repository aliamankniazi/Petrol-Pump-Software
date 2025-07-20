
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  onValue,
  push,
  update,
  remove,
  serverTimestamp,
  type DatabaseReference,
} from 'firebase/database';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';

interface DbDoc {
  id: string;
  [key: string]: any;
}

export function useDatabaseCollection<T extends DbDoc>(collectionName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      setData([]);
      return;
    }

    let collectionRef: DatabaseReference;
    try {
      collectionRef = ref(db, `users/${user.uid}/${collectionName}`);
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
  }, [user, collectionName]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string) => {
    if (!user || !db) return Promise.reject(new Error("Not authenticated or DB not initialized"));
    
    const collectionPath = `users/${user.uid}/${collectionName}`;
    const dataWithTimestamp = { ...newData, timestamp: serverTimestamp() };

    if (docId) {
      const docRef = ref(db, `${collectionPath}/${docId}`);
      await update(docRef.parent!, {[docId]: dataWithTimestamp});
      return { id: docId, ...newData, timestamp: Date.now() } as T;
    } else {
      const collectionRef = ref(db, collectionPath);
      const newDocRef = push(collectionRef);
      await update(newDocRef.parent!, {[newDocRef.key!]: dataWithTimestamp});
      return { id: newDocRef.key!, ...newData, timestamp: Date.now() } as T;
    }
  }, [user, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
    if (!user || !db) return;
    const docRef = ref(db, `users/${user.uid}/${collectionName}/${id}`);
    await update(docRef, updatedData);
  }, [user, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!user || !db) return;
    const docRef = ref(db, `users/${user.uid}/${collectionName}/${id}`);
    await remove(docRef);
  }, [user, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
