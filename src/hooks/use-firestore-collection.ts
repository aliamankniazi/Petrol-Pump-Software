
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc as addFirestoreDoc,
  doc,
  updateDoc as updateFirestoreDoc,
  deleteDoc as deleteFirestoreDoc,
  serverTimestamp,
  type DocumentData,
  type CollectionReference,
  type Unsubscribe,
  type Timestamp,
  setDoc,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';

interface FirestoreDoc {
  id: string;
  [key: string]: any;
}

// A generic hook to manage a Firestore collection for the currently authenticated user.
export function useFirestoreCollection<T extends FirestoreDoc>(collectionName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      // If there's no user or db connection, we can't fetch data.
      // Set loading to false and data to empty array.
      setLoading(false);
      setData([]);
      return;
    }

    let unsubscribe: Unsubscribe = () => {};
    try {
        const collectionPath = `users/${user.uid}/${collectionName}`;
        const collectionRef = collection(db, collectionPath) as CollectionReference<DocumentData>;
        
        unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => {
                const docData = doc.data();
                // Convert Firestore Timestamps to JS Dates
                Object.keys(docData).forEach(key => {
                    if (docData[key] instanceof Timestamp) {
                        docData[key] = docData[key].toDate();
                    }
                });
                return { id: doc.id, ...docData } as T;
            });
            // Sort by timestamp descending
            fetchedData.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return dateB - dateA;
            });
            setData(fetchedData);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            setLoading(false);
        });

    } catch (error) {
        console.error("Error setting up snapshot listener:", error);
        setLoading(false);
    }
    
    return () => unsubscribe();
  }, [user, collectionName]);

  const addDoc = useCallback(async (newData: Omit<T, 'id' | 'timestamp'>, docId?: string) => {
    if (!user || !db) return Promise.reject(new Error("Not authenticated or DB not initialized"));
    
    const collectionPath = `users/${user.uid}/${collectionName}`;
    const dataWithTimestamp = { ...newData, timestamp: serverTimestamp() };

    if (docId) {
        // Create document with a specific ID
        const docRef = doc(db, collectionPath, docId);
        await setDoc(docRef, dataWithTimestamp);
        return { id: docId, ...newData, timestamp: new Date() } as T;
    } else {
        // Create document with an auto-generated ID
        const docRef = await addFirestoreDoc(collection(db, collectionPath), dataWithTimestamp);
        return { id: docRef.id, ...newData, timestamp: new Date() } as T;
    }

  }, [user, collectionName]);
  
  const updateDoc = useCallback(async (id: string, updatedData: Partial<Omit<T, 'id'>>) => {
    if (!user || !db) return;
    const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
    await updateFirestoreDoc(docRef, updatedData);
  }, [user, collectionName]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!user || !db) return;
    const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
    await deleteFirestoreDoc(docRef);
  }, [user, collectionName]);

  return { data, addDoc, updateDoc, deleteDoc, loading };
}
