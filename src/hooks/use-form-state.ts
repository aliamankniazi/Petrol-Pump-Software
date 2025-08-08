
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useFormState<T>(key: string, initialValue: T): [T, (value: T | Partial<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? JSON.parse(item) : initialValue;

      // Ensure customerId is not an empty string on load
      if (parsedItem.customerId === '') {
        parsedItem.customerId = 'walk-in';
      }
      return parsedItem;
      
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | Partial<T>) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : { ...storedValue, ...value };
      setStoredValue(valueToStore as T);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
