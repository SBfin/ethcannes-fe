import { useEffect, useRef } from 'react';

// A custom hook to store the previous value of a prop or state
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
} 