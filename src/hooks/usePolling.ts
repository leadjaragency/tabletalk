"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UsePollingOptions<T> {
  /** Fetch interval in milliseconds (default: 5000) */
  intervalMs?: number;
  /** Whether polling is active (default: true) */
  enabled?: boolean;
  /** Called when new data arrives and differs from previous */
  onNewData?: (data: T, prev: T | null) => void;
}

interface UsePollingResult<T> {
  data:      T | null;
  loading:   boolean;
  error:     string | null;
  refresh:   () => void;
}

/**
 * usePolling — fetches a URL on an interval and returns the latest data.
 *
 * Usage:
 *   const { data, loading, refresh } = usePolling<OrdersResponse>("/api/orders", {
 *     intervalMs: 5000,
 *     onNewData: (next, prev) => { if (next.count > (prev?.count ?? 0)) playSound(); },
 *   });
 */
export function usePolling<T>(
  url: string,
  options: UsePollingOptions<T> = {}
): UsePollingResult<T> {
  const { intervalMs = 5_000, enabled = true, onNewData } = options;

  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const prevDataRef  = useRef<T | null>(null);
  const onNewDataRef = useRef(onNewData);
  onNewDataRef.current = onNewData;

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const res  = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as T;

      setData(json);

      if (onNewDataRef.current && !isInitial) {
        onNewDataRef.current(json, prevDataRef.current);
      }
      prevDataRef.current = json;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [url]);

  // Initial fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Polling interval
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => fetchData(false), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, fetchData]);

  const refresh = useCallback(() => fetchData(false), [fetchData]);

  return { data, loading, error, refresh };
}
