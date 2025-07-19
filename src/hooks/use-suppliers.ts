
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Supplier } from '@/lib/types';

const STORAGE_KEY = 'pumppal-suppliers';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setSuppliers(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse suppliers from localStorage", error);
      setSuppliers([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
      } catch (error) {
        console.error("Failed to save suppliers to localStorage", error);
      }
    }
  }, [suppliers, isLoaded]);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'timestamp'>) => {
    setSuppliers(prev => [
      { ...supplier, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  
  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSuppliers = useCallback(() => {
    setSuppliers([]);
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear suppliers from localStorage", error);
    }
  }, []);

  return { suppliers, addSupplier, deleteSupplier, clearSuppliers, isLoaded };
}
