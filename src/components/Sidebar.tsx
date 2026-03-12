import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Calculator, Play, TrendingDown,
  Zap, Clock, Package, ChevronLeft, ChevronRight,
  Activity, Wallet, BarChart2, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sidebarVariants,
  sidebarLabelVariants,
  springSmooth,
  buttonTapProps,
} from '@/lib/animations';
import type { Channel, AlgorithmMode, AlgorithmUsed } from '@/types';

const NAV_ITEMS = [
  { id: 'input',      label: 'Input Data',  Icon: Upload,      color: '#22C55E' },
  { id: 'schedule',   label: 'Schedule',    Icon: Calculator,  color: '#3b82f6' },
  { id: 'simulation', label: 'Simulation',  Icon: Play,        color: '#F59E0B' },
  { id: 'results',    label: 'Results',     Icon: TrendingDown, color: '#7C3AED' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  channels: Channel[];
  algorithm: AlgorithmMode;
  algorithmUsed: AlgorithmUsed;
  onAlgorithmChange: (a: AlgorithmMode) => void;
  totalTransactions: number;
  totalValue: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  channels,
  algorithm,
  algorithmUsed,
  onAlgorithmChange,
  totalTransactions,
  totalValue,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      className="glass-sidebar relative flex flex-col h-screen sticky top-0 z-40 overflow-hidden flex-shrink-0"
    >
      {/* Toggle button */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        {...buttonTapProps}
        className="absolute -right-3 top-20 z-50 w-6 h-6 glass rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/10"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />
        }
      </motion.button>

      {/* Logo mark (collapsed) */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/5',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              variants={sidebarLabelVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <p className="text-xs font-bold brand-gradient-text whitespace-nowrap">SmartSettle</p>
              <p className="text-[10px] text-white/30 whitespace-nowrap">v2.0 Premium</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Section label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 pb-2"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map(({ id, label, Icon, color }) => {
          const isActive = activeTab === id;
          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              whileHover={{ x: collapsed ? 0 : 3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.15 }}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-[3px]',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-[rgba(124,58,237,0.15)] border-l-[#7C3AED] text-white'
                  : 'border-l-transparent text-white/45 hover:text-white/75 hover:bg-white/5'
              )}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? `${color}25` : 'transparent' }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? color : undefined }}
                />
              </div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    variants={sidebarLabelVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden whitespace-nowrap"
                    style={{ color: isActive ? color : undefined }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: color }}
                  transition={springSmooth}
                />
              )}
            </motion.button>
          );
        })}

        {/* Channels Section */}
        <div className="pt-4">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 pb-2"
              >
                Channels
              </motion.p>
            )}
          </AnimatePresence>
          <div className="space-y-1">
            {channels.map((ch) => {
              const Icon = ch.id === 'Channel_F' ? Zap : ch.id === 'Channel_S' ? Clock : Package;
              const glowColor = ch.id === 'Channel_F' ? 'rgba(16,185,129,0.4)' : ch.id === 'Channel_S' ? 'rgba(59,130,246,0.4)' : 'rgba(245,158,11,0.4)';
              return (
                <div
                  key={ch.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-shadow duration-300"
                    style={{
                      background: `${ch.color}20`,
                      boxShadow: `0 0 12px ${glowColor}`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: ch.color }} />
                  </div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        variants={sidebarLabelVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="overflow-hidden flex-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-white/50 whitespace-nowrap">{ch.name}</span>
                          <span className="text-xs font-mono" style={{ color: ch.color }}>₹{ch.fee}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Algorithm selector */}
        <div className="pt-4">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 pb-2">
                  Algorithm
                </p>
                <button
                  onClick={() => onAlgorithmChange('hybrid')}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-xs transition-all',
                    'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                  )}
                >
                  Hybrid (Best)
                  <span className="ml-1 text-[10px] text-white/50">
                    → {algorithmUsed === 'edf' ? 'EDF' : 'Threshold'}
                  </span>
                </button>
                <p className="text-[10px] text-white/30 px-2 pt-1">
                  Hybrid combines EDF + Threshold and picks the lowest-cost schedule.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom stats */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-white/5 px-4 py-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[11px] text-white/40">Transactions</span>
                <span className="text-[11px] font-bold text-violet-400">{totalTransactions}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[11px] text-white/40">Value</span>
                <span className="text-[11px] font-bold text-cyan-400">₹{totalValue.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
