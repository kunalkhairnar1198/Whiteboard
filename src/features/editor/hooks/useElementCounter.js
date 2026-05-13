import { useCallback, useEffect, useRef, useState } from 'react';

export const useElementCounter = (initial = 0) => {
  const [counter, setCounter] = useState(initial);
  const counterRef = useRef(initial);

  useEffect(() => {
    counterRef.current = counter;
  }, [counter]);

  const increment = useCallback(() => {
    counterRef.current += 1;
    setCounter(counterRef.current);
    return counterRef.current;
  }, []);

  const syncFromState = useCallback((next) => {
    counterRef.current = next;
    setCounter(next);
  }, []);

  return { counter, counterRef, increment, setCounter: syncFromState, syncFromState };
};

export default useElementCounter;
