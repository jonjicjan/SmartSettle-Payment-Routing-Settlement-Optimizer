import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { springSmooth, buttonTapProps } from '@/lib/animations';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'input',      label: 'Input Data',  color: 'text-emerald-400' },
  { id: 'schedule',   label: 'Schedule',    color: 'text-blue-400' },
  { id: 'simulation', label: 'Simulation',  color: 'text-amber-400' },
  { id: 'results',    label: 'Results',     color: 'text-violet-400' },
];

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalCost?: number;
  successRate?: number;
  isOptimizing?: boolean;
}

export function TopNav({ activeTab, onTabChange, totalCost, successRate, isOptimizing }: TopNavProps) {
  return (
    <header className="glass-nav sticky top-0 z-50 w-full">
      {isOptimizing && (
        <div className="flex items-center gap-3 px-6 py-2 border-t border-white/5 bg-black/20">
          <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Optimizing Routing…</span>
          <div className="loading-shimmer-bar flex-1 min-w-0 h-1.5" />
        </div>
      )}
      <div className="flex h-16 items-center justify-between px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={springSmooth}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold brand-gradient-text leading-none">SmartSettle</h1>
            <p className="text-[10px] text-white/40 mt-0.5">Payment Routing Optimizer</p>
          </div>
        </div>

        {/* Tab Pills (center) — gradient active, sliding indicator */}
        <nav className="hidden md:flex items-center gap-0.5 rounded-[20px] p-1 bg-white/[0.03] border border-white/[0.06]">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'tween', duration: 0.15 }}
              className={cn(
                'relative px-5 py-2 rounded-[20px] text-sm font-medium transition-colors duration-200',
                activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/80'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-[20px]"
                  style={{
                    background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                    boxShadow: '0 0 20px rgba(124,58,237,0.25)',
                  }}
                  transition={springSmooth}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Right side status */}
        <div className="flex items-center gap-2">
          {totalCost !== undefined && (
            <AnimatePresence mode="wait">
              <motion.div
                key={totalCost.toFixed(0)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden lg:flex items-center gap-3 pl-4 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Cost</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono number-mono">₹{totalCost.toFixed(2)}</span>
                </div>
                {successRate !== undefined && (
                  <div className="h-4 w-px bg-white/15" aria-hidden />
                )}
                {successRate !== undefined && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Success</span>
                    <span className="text-sm font-bold text-blue-400 font-mono number-mono">{successRate.toFixed(0)}%</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Mobile Tab Row */}
      <div className="md:hidden flex items-center gap-1.5 px-4 pb-3 overflow-x-auto">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            {...buttonTapProps}
            className={cn(
              'relative flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors border',
              activeTab === tab.id
                ? `${tab.color} bg-white/10 border-white/15`
                : 'text-white/45 border-transparent hover:text-white/70'
            )}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>
    </header>
  );
}
