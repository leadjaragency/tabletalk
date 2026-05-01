"use client";

import { type Variants } from "framer-motion";

export const EASING = {
  spring: [0.22, 1, 0.36, 1] as const,
  snappy: [0.34, 1.56, 0.64, 1] as const,
  cinema: [0.16, 1, 0.3, 1] as const,
};

export const DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.7,
  crawl: 1.0,
};

export function fadeUp(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.slow, ease: EASING.cinema, delay },
    },
  };
}

export function fadeIn(delay = 0): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DURATION.normal, ease: EASING.spring, delay },
    },
  };
}

export function slideInLeft(delay = 0): Variants {
  return {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: DURATION.slow, ease: EASING.cinema, delay },
    },
  };
}

export function slideInRight(delay = 0): Variants {
  return {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: DURATION.slow, ease: EASING.cinema, delay },
    },
  };
}

export function scaleIn(delay = 0): Variants {
  return {
    hidden: { opacity: 0, scale: 0.88 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: DURATION.normal, ease: EASING.snappy, delay },
    },
  };
}

export function staggerContainer(staggerDelay = 0.1): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };
}
