"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { fadeUp } from "./MotionConfig";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variants?: Variants;
  threshold?: number;
  once?: boolean;
}

export default function AnimatedSection({
  children,
  className,
  style,
  variants,
  threshold = 0.15,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: threshold });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className} style={style}>{children}</div>;
  }

  const activeVariants = variants ?? fadeUp();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={activeVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}
