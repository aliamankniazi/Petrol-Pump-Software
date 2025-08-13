
'use client';

import { useState, useEffect, useCallback } from 'react';

// This hook is deprecated due to hydration issues.
// State persistence is now handled directly in components using useState and useEffect.
export function useFormState<T>(key: string, initialValue: T): [T, (value: T | Partial<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

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
  
  // Return a stable function that does nothing to avoid breaking components that still use this hook.
  const emptySetter = useCallback(() => {}, []);

  return [initialValue, emptySetter as any];
}
