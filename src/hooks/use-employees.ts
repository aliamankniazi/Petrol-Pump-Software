
'use client';

import { useCallback } from 'react';
import type { Employee } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';

const STORAGE_KEY = 'employees';

export function useEmployees() {
  const { data: employees, setData: setEmployees, isLoaded, clearDataForUser } = useLocalStorage<Employee[]>(STORAGE_KEY, []);

  const addEmployee = useCallback((employee: Omit<Employee, 'id' | 'timestamp' | 'hireDate'> & { hireDate: Date }) => {
    setEmployees(prev => [
      { 
        ...employee, 
        id: crypto.randomUUID(), 
        timestamp: new Date().toISOString(),
        hireDate: employee.hireDate.toISOString(),
      },
      ...(prev || []),
    ]);
  }, [setEmployees]);

  const clearEmployees = useCallback((userId: string) => {
    clearDataForUser(userId);
  }, [clearDataForUser]);

  return { employees: employees || [], addEmployee, clearEmployees, isLoaded };
}
