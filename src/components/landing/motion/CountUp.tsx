"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export default function CountUp({
  target,
  prefix = "",
  suffix = "",
  duration = 1.8,
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(target === 0 ? "0" : "0");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!inView || hasStarted.current || target === 0 || prefersReduced) return;
    hasStarted.current = true;

    const startTime = performance.now();
    const durationMs = duration * 1000;
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutQuart(progress);
      const current = eased * target;
      setDisplay(current.toFixed(decimals));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, duration, decimals, prefersReduced]);

  useEffect(() => {
    if (target === 0 || prefersReduced) {
      setDisplay(target.toFixed(decimals));
    }
  }, [target, decimals, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
