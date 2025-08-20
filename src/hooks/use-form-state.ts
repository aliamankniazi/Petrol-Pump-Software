
'use client';

import { useState, useEffect } from 'react';

// This hook is deprecated due to hydration issues and its complexity.
// State persistence is now handled directly in components using standard React hooks.
export function useFormState<T>(key: string, initialValue: T): [T, (value: T | Partial<T>) => void] {
  // Use React's useState to manage the state. This is the simplest and most reliable approach.
  const [state, setState] = useState(initialValue);

  // Return the state and a simple setter function.
  // The complex logic for localStorage and user-specific keys has been removed
  // to improve stability and avoid hydration errors.
  const setFormState = (value: T | Partial<T>) => {
    if (typeof value === 'function') {
      setState(value);
    } else {
      setState(prevState => ({ ...prevState, ...value }));
    }
  };

  return [state, setFormState as any];
}
