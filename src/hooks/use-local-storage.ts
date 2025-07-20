
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

function useLocalStorage<T>(key: string, initialValue: T): {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  isLoaded: boolean;
  clearData: () => void;
} {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const userScopedKey = user ? `pumppal-${user.uid}-${key}` : null;

  const loadData = useCallback(() => {
    if (!userScopedKey) {
        setData(initialValue); // Reset to initial if no user
        if (!authLoading) setIsLoaded(true);
        return;
    }

    try {
      const item = window.localStorage.getItem(userScopedKey);
      setData(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key "${userScopedKey}":`, error);
      setData(initialValue);
    } finally {
      setIsLoaded(true);
    }
  }, [userScopedKey, initialValue, authLoading]);

  // Load data when user changes
  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && userScopedKey) {
      try {
        window.localStorage.setItem(userScopedKey, JSON.stringify(data));
      } catch (error) {
        console.warn(`Error setting localStorage key "${userScopedKey}":`, error);
      }
    }
  }, [userScopedKey, data, isLoaded]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === userScopedKey) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userScopedKey, loadData]);

  const clearData = useCallback(() => {
    setData(initialValue);
  }, [initialValue]);

  return { data, setData, isLoaded: isLoaded && !authLoading, clearData };
}

export { useLocalStorage };
