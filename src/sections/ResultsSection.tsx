import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileJson, ArrowRight, Package, Wallet,
  CheckCircle, XCircle, Zap, Clock, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { tabEnter, staggerContainer, fadeInUp, buttonTapProps } from '@/lib/animations';
import type { CostBreakdown, ScheduledTransaction, AlgorithmMode, AlgorithmUsed } from '@/types';
import { CHANNELS } from '@/types';
import { downloadJSON } from '@/lib/csvParser';
import { scheduler } from '@/lib/scheduler';
import { toast } from 'sonner';
import { validateConstraints } from '@/lib/constraintValidator';
import type { HybridResult } from '@/lib/hybridScheduler';

interface ResultsSectionProps {
  costBreakdown: CostBreakdown | null;
  scheduledTransactions: ScheduledTransaction[];
  algorithm: AlgorithmMode;
  algorithmUsed: AlgorithmUsed;
  lastHybridResult?: HybridResult | null;
}

const COST_CARDS = [
  { key: 'channel_fees'      as const, label: 'Channel Fees',     color: '#22C55E' },
  { key: 'delay_penalties'   as const, label: 'Delay Penalties',  color: '#F59E0B' },
  { key: 'failure_penalties' as const, label: 'Failure Penalties',color: '#EF4444' },
];

function algorithmLabel(algorithm: AlgorithmMode, algorithmUsed: AlgorithmUsed): string {
  if (algorithm === 'hybrid') return `Hybrid → ${algorithmUsed === 'edf' ? 'EDF' : 'Threshold'}`;
  return algorithm === 'edf' ? 'EDF' : 'Threshold';
}

export function ResultsSection({ costBreakdown, scheduledTransactions, algorithm, algorithmUsed, lastHybridResult }: ResultsSectionProps) {
  const successCount = scheduledTransactions.filter((t) => !t.failed).length;
  const failedCount  = scheduledTransactions.filter((t) => t.failed).length;
  const successRate  = scheduledTransactions.length > 0
    ? (successCount / scheduledTransactions.length) * 100 : 0;

  const submissionPreview = useMemo(() => ({
    assignments: scheduler.getAssignments(),
    total_system_cost_estimate: costBreakdown?.total ?? 0,
  }), [scheduledTransactions, costBreakdown]);

  const submissionPreviewText = useMemo(
    () => JSON.stringify(submissionPreview, null, 2),
    [submissionPreview]
  );

  const validation = useMemo(
    () => (costBreakdown ? validateConstraints(scheduledTransactions, costBreakdown) : null),
    [scheduledTransactions, costBreakdown]
  );

  const handleDownload = () => {
    if (!costBreakdown) return;
    const result = validateConstraints(scheduledTransactions, costBreakdown);
    if (!result.valid) {
      toast.error(result.errors[0] ?? 'Validation failed', {
        description: result.errors.length > 1 ? `${result.errors.length} constraint(s) failed` : undefined,
      });
      return;
    }
    const submission = {
      assignments: scheduler.getAssignments(),
      total_system_cost_estimate: costBreakdown.total,
    };
    downloadJSON(submission, 'submission.json');
    toast.success('Submission JSON downloaded');
  };

  const handleDownloadHybridReport = () => {
    if (!lastHybridResult) return;
    const report = {
      algorithm_used: lastHybridResult.algorithm_used,
      total_cost: lastHybridResult.total_cost,
      successful_transactions: lastHybridResult.successful_transactions,
      failed_transactions: lastHybridResult.failed_transactions,
      average_delay: Math.round(lastHybridResult.average_delay * 100) / 100,
      schedule: lastHybridResult.schedule,
    };
    downloadJSON(report, 'hybrid_report.json');
    toast.success('Hybrid report downloaded');
  };

  if (!costBreakdown) return (
    <motion.div
      variants={tabEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center justify-center h-64 text-white/30"
    >
      Run scheduling to view results
    </motion.div>
  );

  return (
    <motion.div
      variants={tabEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Hero cost banner */}
      <motion.div variants={fadeInUp} className="gradient-border p-6 md:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[11px] text-white/45 uppercase tracking-widest font-medium mb-2">Total System Cost</p>
            <p className="text-4xl md:text-5xl font-bold number-mono tracking-tight" style={{ color: '#22C55E', letterSpacing: '-0.02em' }}>
              ₹<AnimatedNumber value={costBreakdown.total} duration={0.8} decimals={2} />
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: 'Success Rate', value: successRate, suffix: '%', decimals: 1, color: '#22C55E' },
              { label: 'Total TXs',    value: scheduledTransactions.length, color: '#3b82f6' },
            ].map(({ label, value, suffix = '', decimals = 0, color }) => (
              <div
                key={label}
                className="text-center px-5 py-3.5 rounded-xl min-w-[100px] transition-colors"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}
              >
                <div className="text-xl font-bold number-mono" style={{ color }}>
                  <AnimatedNumber value={value} duration={0.8} decimals={decimals} suffix={suffix} />
                </div>
                <div className="text-[11px] text-white/40 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Cost breakdown cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {COST_CARDS.map(({ key, label, color }, i) => {
          const value = costBreakdown[key];
          const pct = costBreakdown.total > 0 ? (value / costBreakdown.total) * 100 : 0;
          return (
            <motion.div
              key={key}
              variants={fadeInUp}
              className="glass-card p-5 rounded-2xl relative overflow-hidden group"
            >
              <div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-8 group-hover:opacity-15 transition-opacity"
                style={{ background: color, filter: 'blur(20px)' }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40">{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-xs font-bold"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-bold number-mono mb-3" style={{ color }}>
                  ₹<AnimatedNumber value={value} duration={0.8} decimals={2} />
                </div>
                <AnimatedProgress value={pct} color={color} height={4} delay={i * 150} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Constraint validation status */}
      <GlassCard glowColor={validation?.valid ? '#22C55E' : '#EF4444'}>
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: validation?.valid ? '#22C55E18' : '#EF444418',
              border: `1px solid ${validation?.valid ? '#22C55E40' : '#EF444440'}`,
            }}
          >
            {validation?.valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white/90 mb-1">
              Constraint validation
            </h3>
            {validation?.valid ? (
              <p className="text-xs text-white/50">
                All checks passed. Submission is safe for judge (no early starts, capacity OK, cost match).
              </p>
            ) : (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs text-red-400/90 font-medium">
                  {validation?.errors.length} check(s) failed — fix before submitting.
                </p>
                <ul className="text-[11px] text-white/40 font-mono space-y-0.5 max-h-24 overflow-y-auto">
                  {validation?.errors.map((err, i) => (
                    <li key={i} className="text-red-300/80">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Channel distribution + Transaction summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard glowColor="#3b82f6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#3b82f618' }}>
              <Package className="w-3.5 h-3.5 text-blue-400" />
            </div>
            Channel Distribution
          </h3>
          <div className="space-y-4">
            {CHANNELS.map((channel, i) => {
              const count = scheduledTransactions.filter((tx) => tx.channel_id === channel.id).length;
              const pct = scheduledTransactions.length > 0 ? (count / scheduledTransactions.length) * 100 : 0;
              const Icon = channel.id === 'Channel_F' ? Zap : channel.id === 'Channel_S' ? Clock : Package;
              return (
                <div key={channel.id} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2" style={{ color: channel.color }}>
                      <Icon className="w-3.5 h-3.5" />{channel.name}
                    </span>
                    <span className="text-white/35">{count} txs ({pct.toFixed(1)}%)</span>
                  </div>
                  <AnimatedProgress value={pct} color={channel.color} height={4} delay={i * 100} />
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard glowColor="#22C55E">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#22C55E18' }}>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            Transaction Summary
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Successful', value: successCount, badge: 'chip-success', icon: CheckCircle, iconColor: '#22C55E' },
              { label: 'Failed',     value: failedCount,  badge: 'chip-danger',  icon: XCircle,    iconColor: '#EF4444' },
            ].map(({ label, value, badge, icon: Icon, iconColor }) => (
              <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-white/3">
                <span className="text-sm text-white/50">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: iconColor }}>{value}</span>
                  <span className={badge}>
                    <Icon className="w-3 h-3 inline mr-1" />
                    {label === 'Successful' ? 'Settled' : 'Missed'}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/3">
              <span className="text-sm text-white/50">Total Value</span>
              <span className="font-mono text-blue-400 text-sm font-bold">
                ₹{scheduledTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/3">
              <span className="text-sm text-white/50">Algorithm</span>
              <span className="chip-violet">{algorithmLabel(algorithm, algorithmUsed)}</span>
            </div>
            {algorithm === 'hybrid' && lastHybridResult && lastHybridResult.edf_cost != null && lastHybridResult.threshold_cost != null && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Hybrid comparison</p>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">EDF cost</span>
                  <span className="font-mono">₹{lastHybridResult.edf_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Threshold cost</span>
                  <span className="font-mono">₹{lastHybridResult.threshold_cost.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-emerald-400/90 pt-0.5">
                  Selected {lastHybridResult.algorithm_used} (lowest cost)
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* submission.json preview (raw JSON) */}
      <GlassCard noPadding glowColor="#7C3AED">
        <div className="card-header-highlight px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED18' }}>
              <FileJson className="w-3.5 h-3.5 text-violet-400" />
            </div>
            submission.json (preview)
          </h3>
          <span className="chip-violet">
            {scheduler.getAssignments().length} assignments
          </span>
        </div>

        <div className="p-5">
          <pre className="max-h-[520px] overflow-auto text-[11px] leading-relaxed font-mono text-white/70 bg-black/20 border border-white/8 rounded-2xl p-4">
            {submissionPreviewText}
          </pre>
        </div>
      </GlassCard>

      {/* Download Buttons */}
      <motion.div variants={fadeInUp} className="space-y-3" {...buttonTapProps}>
        <Button
          onClick={handleDownload}
          disabled={!validation?.valid}
          className="w-full accent-gradient text-white font-semibold py-6 rounded-2xl text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed btn-primary-glow"
        >
          <FileJson className="w-5 h-5 mr-2" />
          {validation?.valid ? 'Download submission.json' : 'Fix validation errors to download'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        {algorithm === 'hybrid' && lastHybridResult && (
          <Button
            variant="outline"
            onClick={handleDownloadHybridReport}
            className="w-full border-white/10 bg-white/4 hover:bg-white/8 text-white/80 font-medium py-4 rounded-2xl text-sm"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Download hybrid report (algorithm_used, schedule, costs)
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
