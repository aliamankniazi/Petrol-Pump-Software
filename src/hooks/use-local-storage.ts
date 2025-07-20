
// This file is no longer used and is replaced by use-firestore-collection.ts
// It is kept here to prevent breaking changes if it was imported somewhere,
// but it should be considered deprecated.

'use client';

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  isLoaded: boolean;
  clearDataForUser: (userId: string) => void;
} {
  const [data, setData] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // This hook is deprecated, so we just set loaded to true.
    setIsLoaded(true);
  }, []);

  const clearDataForUser = useCallback(() => {
    // This function is now a no-op as data is stored in Firestore.
  }, []);

  return { data, setData, isLoaded, clearDataForUser };
}

export { useLocalStorage };
