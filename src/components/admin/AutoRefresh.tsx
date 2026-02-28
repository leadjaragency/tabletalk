"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mounts a setInterval that calls router.refresh() every `intervalMs` milliseconds.
 * Place anywhere in the page tree — renders nothing.
 */
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
