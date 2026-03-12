import type { Variants, Transition } from 'framer-motion';

// ─── Spring Configs ────────────────────────────────────────────────────────────
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const springStiff: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
};

export const easeFast: Transition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.25,
};

export const easeOut: Transition = {
  type: 'tween',
  ease: [0, 0, 0.2, 1],
  duration: 0.35,
};

// ─── Page-level Variants ───────────────────────────────────────────────────────
export const pageFadeSlide: Variants = {
  hidden:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...springSmooth, staggerChildren: 0.06 },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: easeFast,
  },
};

// ─── Card / Item Variants ──────────────────────────────────────────────────────
export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springBouncy },
};

export const fadeInLeft: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: springBouncy },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
};

// ─── Stagger Container ─────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerFast: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0,
    },
  },
};

// ─── Card Hover / Tap ──────────────────────────────────────────────────────────
export const cardHoverProps = {
  whileHover: {
    y: -3,
    transition: { type: 'tween', ease: 'easeOut', duration: 0.25 },
  },
  whileTap: { scale: 0.99, transition: springStiff },
};

export const buttonTapProps = {
  whileHover: { scale: 1.05, transition: { type: 'tween', duration: 0.15 } },
  whileTap:   { scale: 0.97, transition: { type: 'tween', duration: 0.1 } },
};

// ─── Sidebar Variants ──────────────────────────────────────────────────────────
export const sidebarVariants: Variants = {
  expanded:  { width: 240, transition: springSmooth },
  collapsed: { width: 72,  transition: springSmooth },
};

export const sidebarLabelVariants: Variants = {
  expanded:  { opacity: 1, x: 0,   width: 'auto', transition: easeOut },
  collapsed: { opacity: 0, x: -8,  width: 0,      transition: easeFast },
};

// ─── Tab Transition Variants ───────────────────────────────────────────────────
export const tabEnter: Variants = {
  hidden:  { opacity: 0, x: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springSmooth, staggerChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: easeFast,
  },
};

// ─── Number Counter Helpers ─────────────────────────────────────────────────────
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}
