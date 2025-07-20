
'use client';

import { useState, useEffect, useCallback, SetStateAction } from 'react';
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

  const stableInitialValue = JSON.stringify(initialValue);

  const loadData = useCallback(() => {
    if (!userScopedKey) {
        setData(JSON.parse(stableInitialValue)); 
        if (!authLoading) setIsLoaded(true);
        return;
    }

    try {
      const item = window.localStorage.getItem(userScopedKey);
      setData(item ? JSON.parse(item) : JSON.parse(stableInitialValue));
    } catch (error) {
      console.warn(`Error reading localStorage key "${userScopedKey}":`, error);
      setData(JSON.parse(stableInitialValue));
    } finally {
      setIsLoaded(true);
    }
  }, [userScopedKey, stableInitialValue, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, userScopedKey]); // Removed loadData from dependencies

  useEffect(() => {
    if (isLoaded && userScopedKey) {
      try {
        window.localStorage.setItem(userScopedKey, JSON.stringify(data));
      } catch (error) {
        console.warn(`Error setting localStorage key "${userScopedKey}":`, error);
      }
    }
  }, [userScopedKey, data, isLoaded]);

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
    setData(JSON.parse(stableInitialValue));
  }, [stableInitialValue]);

  return { data, setData, isLoaded: isLoaded && !authLoading, clearData };
}

export { useLocalStorage };
