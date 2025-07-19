
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee } from '@/lib/types';

const STORAGE_KEY = 'pumppal-employees';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setEmployees(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse employees from localStorage", error);
      setEmployees([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);
  
  useEffect(() => {
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
      } catch (error) {
        console.error("Failed to save employees to localStorage", error);
      }
    }
  }, [employees, isLoaded]);

  const addEmployee = useCallback((employee: Omit<Employee, 'id' | 'timestamp' | 'hireDate'> & { hireDate: Date }) => {
    setEmployees(prev => [
      { 
        ...employee, 
        id: crypto.randomUUID(), 
        timestamp: new Date().toISOString(),
        hireDate: employee.hireDate.toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const clearEmployees = useCallback(() => {
    setEmployees([]);
  }, []);

  return { employees, addEmployee, clearEmployees, isLoaded };
}
