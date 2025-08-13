
'use client';

// This hook is deprecated due to hydration issues and has been removed to prevent further errors.
// State persistence is now handled directly in components using standard React hooks like useState and useEffect.
export function useFormState<T>(key: string, initialValue: T): [T, (value: T | Partial<T>) => void] {
  // Return a stable function that does nothing to avoid breaking components that still use this hook.
  const emptySetter = () => {};

  return [initialValue, emptySetter as any];
}
