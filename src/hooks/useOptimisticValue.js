import { useCallback, useEffect, useRef, useState } from 'react';

const useOptimisticValue = (remoteValue, settleMs = 700) => {
  const [localValue, setLocalValue] = useState(remoteValue);
  const lastLocalUpdateAtRef = useRef(0);
  const latestRemoteValueRef = useRef(remoteValue);
  const settleTimerRef = useRef(null);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestRemoteValueRef.current = remoteValue;
    const elapsed = Date.now() - lastLocalUpdateAtRef.current;

    if (elapsed >= settleMs) {
      clearSettleTimer();
      setLocalValue(remoteValue);
      return undefined;
    }

    const syncTimer = window.setTimeout(() => {
      setLocalValue(remoteValue);
    }, settleMs - elapsed);

    return () => window.clearTimeout(syncTimer);
  }, [clearSettleTimer, remoteValue, settleMs]);

  useEffect(() => () => {
    clearSettleTimer();
  }, [clearSettleTimer]);

  const setOptimisticValue = useCallback((nextValue) => {
    clearSettleTimer();
    lastLocalUpdateAtRef.current = Date.now();
    setLocalValue(nextValue);
    settleTimerRef.current = window.setTimeout(() => {
      setLocalValue(latestRemoteValueRef.current);
      settleTimerRef.current = null;
    }, settleMs);
  }, [clearSettleTimer, settleMs]);

  const rollbackValue = useCallback(() => {
    clearSettleTimer();
    lastLocalUpdateAtRef.current = 0;
    setLocalValue(remoteValue);
  }, [clearSettleTimer, remoteValue]);

  return [localValue, setOptimisticValue, rollbackValue];
};

export default useOptimisticValue;
