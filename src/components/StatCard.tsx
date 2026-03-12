import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  trend?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  className,
}: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={cn('glass-card relative group cursor-default overflow-hidden', className)}
    >
      {/* Background glow spot */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: color, filter: 'blur(20px)' }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">{title}</p>
            <p className="text-3xl font-bold number-mono leading-none" style={{ color }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-white/30 mt-1.5">{subtitle}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}25` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>

        {trend && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <span className="text-xs text-white/35">{trend}</span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
    </motion.div>
  );
}
