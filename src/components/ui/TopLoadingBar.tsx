"use client";

import { useEffect, useState } from "react";

interface TopLoadingBarProps {
  visible: boolean;
}

export function TopLoadingBar({ visible }: TopLoadingBarProps) {
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!visible) {
      setWidth(100);
      const t = setTimeout(() => setOpacity(0), 300);
      return () => clearTimeout(t);
    }

    setOpacity(1);
    setWidth(0);

    // Quickly jump to 30%, then crawl to 85%
    const t1 = setTimeout(() => setWidth(30), 30);
    const t2 = setTimeout(() => setWidth(55), 400);
    const t3 = setTimeout(() => setWidth(75), 1000);
    const t4 = setTimeout(() => setWidth(85), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [visible]);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full"
      style={{ opacity }}
    >
      <div
        className="h-full"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, #C6A34E, #D4B86A)",
          boxShadow: "0 0 8px rgba(198,163,78,0.7)",
          transition: visible
            ? "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            : "width 0.25s ease-out, opacity 0.3s ease 0.25s",
        }}
      />
    </div>
  );
}
