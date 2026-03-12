import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GlassCard } from '@/components/GlassCard';
import { ChannelCard } from '@/components/ChannelCard';
import { StatCard } from '@/components/StatCard';
import { OptimizationVisualizer } from '@/components/OptimizationVisualizer';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { tabEnter, staggerContainer, fadeInUp, buttonTapProps } from '@/lib/animations';
import type { ScheduledTransaction, AlgorithmMode, AlgorithmUsed } from '@/types';
import { CHANNELS } from '@/types';

interface SimulationSectionProps {
  scheduledTransactions: ScheduledTransaction[];
  currentTime: number;
  maxTime: number;
  isSimulating: boolean;
  simulationSpeed: number;
  algorithm: AlgorithmMode;
  algorithmUsed: AlgorithmUsed;
  onSimulateToggle: () => void;
  onReset: () => void;
  onSpeedChange: (v: number) => void;
  getChannelUtilization: (id: string) => { used: number; total: number; transactions: string[] };
  getActiveTransactions: () => ScheduledTransaction[];
  getPendingTransactions: () => ScheduledTransaction[];
  getCompletedTransactions: () => ScheduledTransaction[];
  getFailedTransactions: () => ScheduledTransaction[];
}

export function SimulationSection({
  scheduledTransactions,
  currentTime,
  maxTime,
  isSimulating,
  simulationSpeed,
  algorithm,
  onSimulateToggle,
  onReset,
  onSpeedChange,
  getChannelUtilization,
  getActiveTransactions,
  getPendingTransactions,
  getCompletedTransactions,
  getFailedTransactions,
  algorithmUsed,
}: SimulationSectionProps) {
  return (
    <motion.div
      variants={tabEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Time Controller */}
      <GlassCard glowColor="#F59E0B">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <motion.div {...buttonTapProps}>
            <Button
              onClick={onSimulateToggle}
              className={`${
                isSimulating
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'accent-gradient text-white hover:opacity-90'
              } font-semibold px-5 py-2.5 rounded-xl`}
              variant="ghost"
            >
              {isSimulating
                ? <><Pause className="w-4 h-4 mr-2" /> Pause</>
                : <><Play  className="w-4 h-4 mr-2" /> Play Simulation</>
              }
            </Button>
          </motion.div>

          <motion.div {...buttonTapProps}>
            <Button
              variant="outline"
              onClick={onReset}
              className="border-white/10 bg-white/4 hover:bg-white/8 text-white/70 rounded-xl px-4 py-2.5"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </motion.div>

          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className="text-xs text-white/40 whitespace-nowrap">Speed</span>
            <Slider
              value={[simulationSpeed]}
              onValueChange={(v) => onSpeedChange(v[0])}
              min={50} max={1000} step={50}
              className="flex-1"
            />
            <span className="text-xs text-white/40 w-14 text-right">{simulationSpeed}ms</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold font-mono number-mono text-amber-400">
            {currentTime}
            <span className="text-xl text-white/30 ml-1">m</span>
          </div>
          <div className="flex-1">
            <AnimatedProgress
              value={(currentTime / maxTime) * 100}
              color="#F59E0B"
              height={8}
            />
          </div>
          <div className="text-white/30 font-mono text-sm">{maxTime}m</div>
        </div>
      </GlassCard>

      {/* Channel Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {CHANNELS.map((channel, i) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            utilization={getChannelUtilization(channel.id)}
            isActive={getChannelUtilization(channel.id).used > 0}
            index={i}
          />
        ))}
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard title="Active"    value={getActiveTransactions().length}    subtitle="Processing"         icon={Zap}         color="#3b82f6" />
        <StatCard title="Pending"   value={getPendingTransactions().length}   subtitle="Queued"             icon={Clock}       color="#F59E0B" />
        <StatCard title="Completed" value={getCompletedTransactions().length} subtitle="Successfully settled" icon={CheckCircle} color="#22C55E" />
        <StatCard title="Failed"    value={getFailedTransactions().length}    subtitle="Missed deadlines"   icon={XCircle}     color="#EF4444" />
      </motion.div>

      {/* Optimization Visualizer */}
      <GlassCard noPadding>
        <div className="p-5">
          <OptimizationVisualizer
            scheduledTransactions={scheduledTransactions}
            currentTime={currentTime}
            algorithm={algorithm}
            algorithmUsed={algorithmUsed}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}
