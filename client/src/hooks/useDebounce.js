import { useState, useEffect } from 'react';

/**
 * Standard debounce hook to prevent excessive updates or API hits
 * @param {any} value - Input state value
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced state value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
