"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useParams, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerRestaurant {
  id:       string;
  name:     string;
  slug:     string;
  tagline:  string | null;
  cuisine:  string;
  hours:    unknown;
  taxRate:  number;
  currency: string;
  phone:    string | null;
  email:    string | null;
  address:  string | null;
}

export interface CustomerTable {
  id: string;
  number: number;
  seats: number;
  status: string;
}

export interface CustomerWaiter {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  tone: string;
  languages: string[];
  greeting: string | null;
}

export interface CustomerContextValue {
  restaurant: CustomerRestaurant | null;
  table: CustomerTable | null;
  waiter: CustomerWaiter | null;
  /** Session ID created by the splash page after POST /api/sessions */
  sessionId: string | null;
  setSessionId: (id: string) => void;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider — fetches restaurant + table data from the public info endpoint
// ---------------------------------------------------------------------------

export function CustomerProvider({ children }: { children: ReactNode }) {
  const params      = useParams<{ tableId: string }>();
  const searchParams = useSearchParams();

  const restaurantSlug = searchParams.get("restaurant") ?? "";
  const tableNumber    = Number(params.tableId);

  const [restaurant, setRestaurant] = useState<CustomerRestaurant | null>(null);
  const [table,      setTable]      = useState<CustomerTable | null>(null);
  const [waiter,     setWaiter]     = useState<CustomerWaiter | null>(null);
  const sessionKey = restaurantSlug && !isNaN(tableNumber)
    ? `tt-session-${restaurantSlug}-${tableNumber}`
    : null;

  const [sessionId,  setSessionIdState]  = useState<string | null>(() => {
    if (typeof window === "undefined" || !sessionKey) return null;
    return localStorage.getItem(sessionKey);
  });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const storeSessionId = useCallback((id: string) => {
    setSessionIdState(id);
    if (sessionKey) localStorage.setItem(sessionKey, id);
  }, [sessionKey]);

  useEffect(() => {
    if (!restaurantSlug) {
      setError("Restaurant not specified. Please scan your table's QR code again.");
      setLoading(false);
      return;
    }
    if (isNaN(tableNumber)) {
      setError("Invalid table number.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(
      `/api/customer/info?restaurant=${encodeURIComponent(restaurantSlug)}&table=${tableNumber}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? "Failed to load restaurant info.");
        }
        return res.json() as Promise<{
          restaurant: CustomerRestaurant;
          table: CustomerTable;
          waiter: CustomerWaiter | null;
        }>;
      })
      .then(({ restaurant, table, waiter }) => {
        setRestaurant(restaurant);
        setTable(table);
        setWaiter(waiter);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [restaurantSlug, tableNumber]);

  return (
    <CustomerContext.Provider
      value={{ restaurant, table, waiter, sessionId, setSessionId: storeSessionId, loading, error }}
    >
      {children}
    </CustomerContext.Provider>
  );
}
