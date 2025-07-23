
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useDatabaseCollection } from './use-database-collection';
import { useRoles } from './use-roles.tsx';

const COLLECTION_NAME = 'employees';

export function useEmployees() {
  const { currentInstitution } = useRoles();
  const { data: employees, addDoc, updateDoc, deleteDoc, loading } = useDatabaseCollection<Employee>(COLLECTION_NAME, currentInstitution?.id || null);

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
