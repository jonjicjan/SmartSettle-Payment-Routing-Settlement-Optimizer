import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { Zap, Clock, Package, TrendingDown, Activity } from 'lucide-react';
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations';
import type { ScheduledTransaction } from '@/types';

/* ──────────────────────────────────────────────────────────────────────────── */
/* Node layout                                                                   */
/* ──────────────────────────────────────────────────────────────────────────── */
const BASE_NODES = [
  { id: 'Channel_F', label: 'FAST',     color: '#10b981', icon: 'zap',     x: 160, y: 80  },
  { id: 'Channel_S', label: 'STANDARD', color: '#3b82f6', icon: 'clock',   x: 320, y: 200 },
  { id: 'Channel_B', label: 'BULK',     color: '#f59e0b', icon: 'package', x: 80,  y: 210 },
];

const BANK_NODE = { id: 'bank', label: 'Bank Hub', color: '#7C3AED', x: 200, y: 155 };

/* ──────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                       */
/* ──────────────────────────────────────────────────────────────────────────── */
function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

interface TooltipPayload {
  value: number;
  name: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-xs border border-white/10">
        <p className="text-white/50 mb-1">t={label}m</p>
        {payload.map((p) => (
          <p key={p.name} className="font-mono font-bold" style={{ color: '#7C3AED' }}>
            Cost: ₹{p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Main component                                                                */
/* ──────────────────────────────────────────────────────────────────────────── */
interface OptimizationVisualizerProps {
  scheduledTransactions: ScheduledTransaction[];
  currentTime: number;
  algorithm: 'edf' | 'threshold' | 'hybrid';
  algorithmUsed?: 'edf' | 'threshold';
}

export function OptimizationVisualizer({
  scheduledTransactions,
  currentTime,
  algorithm,
  algorithmUsed = 'edf',
}: OptimizationVisualizerProps) {
  /* ── Active channels at currentTime ── */
  const activeChannels = useMemo(() => {
    const set = new Set<string>();
    scheduledTransactions.forEach((tx) => {
      if (
        !tx.failed &&
        tx.channel_id &&
        tx.start_time !== null &&
        tx.end_time !== null &&
        currentTime >= tx.start_time &&
        currentTime < tx.end_time
      ) {
        set.add(tx.channel_id);
      }
    });
    return set;
  }, [scheduledTransactions, currentTime]);

  /* ── Cost timeline data ── */
  const costData = useMemo(() => {
    if (!scheduledTransactions.length) return [];
    const maxT = Math.max(
      ...scheduledTransactions.map((t) => (t.failed ? t.arrival_time : t.end_time ?? 0))
    );
    const step = Math.max(1, Math.floor(maxT / 40));
    const points: { t: number; cost: number }[] = [];
    let runningCost = 0;
    for (let t = 0; t <= Math.min(currentTime, maxT); t += step) {
      const completed = scheduledTransactions.filter(
        (tx) => tx.end_time !== null && tx.end_time <= t
      );
      runningCost = completed.reduce((s, tx) => s + tx.total_cost, 0);
      points.push({ t, cost: runningCost });
    }
    return points;
  }, [scheduledTransactions, currentTime]);

  /* ── Compute node jitter based on algorithm (use selected when hybrid) ── */
  const nodes = useMemo(() => {
    const jitter = (algorithm === 'threshold' || (algorithm === 'hybrid' && algorithmUsed === 'threshold')) ? 20 : 0;
    return BASE_NODES.map((n, i) => ({
      ...n,
      x: n.x + (i % 2 === 0 ? jitter : -jitter) * 0.3,
      y: n.y + (i === 1 ? jitter * 0.5 : 0),
    }));
  }, [algorithm, algorithmUsed]);

  /* ── Packet animation ── */
  const [packetPos, setPacketPos] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPacketPos((p) => (p + 0.02) % 1), 50);
    return () => clearInterval(id);
  }, []);

  const totalCost = useMemo(
    () => scheduledTransactions.filter((t) => !t.failed).reduce((s, t) => s + t.total_cost, 0),
    [scheduledTransactions]
  );

  const successCount = scheduledTransactions.filter((t) => !t.failed).length;
  const failedCount  = scheduledTransactions.filter((t) => t.failed).length;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Optimization Visualizer</h3>
            <p className="text-[10px] text-white/35">Real-time routing graph</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip-violet">
            {algorithm === 'hybrid' ? `Hybrid → ${algorithmUsed === 'edf' ? 'EDF' : 'Threshold'}` : algorithm === 'edf' ? 'EDF' : 'Threshold'}
          </span>
          <span className="chip-success">₹{totalCost.toFixed(2)}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── SVG Routing Graph ── */}
        <motion.div
          variants={fadeInUp}
          className="glass-card p-5 rounded-2xl relative overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.08), transparent 70%)' }}
          />

          <p className="text-xs font-medium text-white/40 mb-3 uppercase tracking-widest">
            Routing Graph
          </p>

          <svg
            viewBox="0 0 400 280"
            className="w-full"
            style={{ maxHeight: '240px' }}
          >
            <defs>
              <filter id="node-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="line-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill="rgba(255,255,255,0.2)" />
              </marker>
            </defs>

            {/* Connection lines (hub → channels) */}
            {nodes.map((node) => {
              const isActive = activeChannels.has(node.id);
              const pathD = cubicPath(BANK_NODE.x, BANK_NODE.y, node.x, node.y);
              return (
                <g key={`line-${node.id}`}>
                  {/* Base dimmed line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1.5"
                  />
                  {/* Animated active line */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.path
                        key={`active-${node.id}`}
                        d={pathD}
                        fill="none"
                        stroke={node.color}
                        strokeWidth="2"
                        filter="url(#line-glow)"
                        strokeDasharray="4 4"
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={{ opacity: 1, pathLength: 1, strokeDashoffset: [0, -8] }}
                        exit={{ opacity: 0 }}
                        transition={{
                          pathLength: { duration: 0.5, ease: 'easeOut' },
                          strokeDashoffset: { duration: 0.6, repeat: Infinity, ease: 'linear' },
                          opacity: { duration: 0.3 },
                        }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Moving packet dot */}
                  {isActive && (() => {
                    const t = packetPos;
                    // Rough quadratic point along the cubic
                    const mx = (BANK_NODE.x + node.x) / 2;
                    const px = (1-t)*(1-t)*BANK_NODE.x + 2*(1-t)*t*mx + t*t*node.x;
                    const py = (1-t)*(1-t)*BANK_NODE.y + 2*(1-t)*t*BANK_NODE.y + t*t*node.y;
                    return (
                      <circle
                        key={`pkt-${node.id}`}
                        cx={px} cy={py} r={3}
                        fill={node.color}
                        filter="url(#node-glow)"
                        opacity={0.9}
                      />
                    );
                  })()}
                </g>
              );
            })}

            {/* Central Bank Hub node */}
            <motion.g
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: `${BANK_NODE.x}px`, originY: `${BANK_NODE.y}px` }}
            >
              {/* Outer ring */}
              <circle
                cx={BANK_NODE.x} cy={BANK_NODE.y} r={28}
                fill="none"
                stroke="rgba(124,58,237,0.3)"
                strokeWidth="1"
              />
              <circle
                cx={BANK_NODE.x} cy={BANK_NODE.y} r={22}
                fill="rgba(124,58,237,0.12)"
                stroke="rgba(124,58,237,0.5)"
                strokeWidth="1.5"
                filter="url(#node-glow)"
              />
              <text
                x={BANK_NODE.x} y={BANK_NODE.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="#7C3AED" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif"
              >HUB</text>
              <text
                x={BANK_NODE.x} y={BANK_NODE.y + 38}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter,sans-serif"
              >Bank Hub</text>
            </motion.g>

            {/* Channel nodes */}
            {nodes.map((node) => {
              const isActive = activeChannels.has(node.id);
              const Icon = node.icon === 'zap' ? '⚡' : node.icon === 'clock' ? '⏱' : '📦';
              return (
                <motion.g
                  key={node.id}
                  animate={isActive
                    ? { scale: [1, 1.08, 1], transition: { duration: 1.5, repeat: Infinity } }
                    : { scale: 1 }
                  }
                  style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
                >
                  {/* Outer pulse ring (active only) */}
                  {isActive && (
                    <motion.circle
                      cx={node.x} cy={node.y} r={28}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="1"
                      animate={{ r: [22, 32], opacity: [0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  {/* Main node */}
                  <circle
                    cx={node.x} cy={node.y} r={20}
                    fill={isActive ? `${node.color}25` : 'rgba(255,255,255,0.04)'}
                    stroke={node.color}
                    strokeWidth={isActive ? 2 : 1}
                    filter={isActive ? 'url(#node-glow)' : undefined}
                  />
                  <text
                    x={node.x} y={node.y + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="12"
                  >{Icon}</text>
                  <text
                    x={node.x} y={node.y + 30}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={node.color} fontSize="8" fontWeight="600" fontFamily="Inter,sans-serif"
                  >{node.label}</text>
                  {/* Active indicator */}
                  {isActive && (
                    <circle
                      cx={node.x + 16} cy={node.y - 14} r={4}
                      fill="#22C55E"
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 justify-center">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: node.color }} />
                <span className="text-[10px] text-white/35">{node.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Cost Timeline Chart ── */}
        <motion.div variants={fadeInUp} className="glass-card p-5 rounded-2xl space-y-4">
          <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
            Cost Accumulation
          </p>

          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="t"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${v}m`}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="url(#costLineGrad)"
                  strokeWidth={2}
                  fill="url(#costAreaGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#06B6D4', stroke: 'rgba(6,182,212,0.5)', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Cost', value: `₹${totalCost.toFixed(2)}`, color: '#7C3AED' },
              { label: 'Settled', value: successCount, color: '#22C55E' },
              { label: 'Failed', value: failedCount, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center px-2 py-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <div className="text-sm font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px] text-white/35 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
