
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useFirestoreCollection } from './use-firestore-collection';

const COLLECTION_NAME = 'employees';

export function useEmployees() {
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useFirestoreCollection<Employee>(COLLECTION_NAME);

  const addEmployee = useCallback((employee: Omit<Employee, 'id' | 'timestamp'>) => {
    addDoc(employee);
  }, [addDoc]);

  const updateEmployee = useCallback((id: string, updatedDetails: Partial<Omit<Employee, 'id' | 'timestamp'>>) => {
    updateDoc(id, updatedDetails);
  }, [updateDoc]);

  const deleteEmployee = useCallback((id: string) => {
    deleteDoc(id);
  }, [deleteDoc]);


  return { 
    employees: employees || [], 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    isLoaded: !loading 
  };
}
