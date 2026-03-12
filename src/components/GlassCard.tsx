import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHoverProps } from '@/lib/animations';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  glowColor?: string;
  noPadding?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  children,
  className,
  glowColor,
  noPadding = false,
  style,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      {...cardHoverProps}
      {...props}
      className={cn(
        'glass-card group relative overflow-hidden',
        !noPadding && 'p-5',
        className
      )}
      style={{
        ...style,
        ...(glowColor ? { '--glow-color': glowColor } as React.CSSProperties : {}),
      }}
    >
      {/* Inner highlight line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 20%, rgba(255,255,255,0.14) 80%, transparent 100%)',
        }}
      />
      {/* Optional glow overlay on hover */}
      {glowColor && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            borderRadius: 'var(--card-radius)',
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${glowColor}18, transparent 55%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
