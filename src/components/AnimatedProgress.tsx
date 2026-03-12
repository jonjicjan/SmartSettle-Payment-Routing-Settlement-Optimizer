import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedProgressProps {
  value: number;           // 0–100
  color?: string;
  height?: number;         // px
  showGlow?: boolean;
  className?: string;
  delay?: number;
}

export function AnimatedProgress({
  value,
  color = '#7C3AED',
  height = 6,
  showGlow = true,
  className = '',
  delay = 0,
}: AnimatedProgressProps) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50 + delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-full bg-white/5 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: mounted ? `${Math.min(value, 100)}%` : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30, delay: delay / 1000 }}
        style={{
          background: color,
          ...(showGlow ? { boxShadow: `0 0 10px ${color}80` } : {}),
        }}
      />
    </div>
  );
}
