import { motion } from 'framer-motion';
import { Zap, Clock, Package } from 'lucide-react';
import { fadeInUp, springSmooth } from '@/lib/animations';
import { AnimatedProgress } from './AnimatedProgress';
import type { Channel } from '@/types';

const CHANNEL_ICONS = {
  Channel_F: Zap,
  Channel_S: Clock,
  Channel_B: Package,
};

const CHANNEL_CLASSES = {
  Channel_F: 'channel-fast glow-fast',
  Channel_S: 'channel-standard glow-standard',
  Channel_B: 'channel-bulk glow-bulk',
};

interface ChannelCardProps {
  channel: Channel;
  utilization: { used: number; total: number; transactions: string[] };
  isActive?: boolean;
  index?: number;
}

export function ChannelCard({ channel, utilization, isActive, index = 0 }: ChannelCardProps) {
  const percentage = (utilization.used / utilization.total) * 100;
  const Icon = CHANNEL_ICONS[channel.id];
  const cls = CHANNEL_CLASSES[channel.id];

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, scale: 1.01, transition: springSmooth }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-2xl border p-5 ${cls} transition-all duration-300 overflow-hidden ${isActive ? 'scale-[1.02]' : ''}`}
    >
      {/* Subtle animated bg pulse when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-20"
          style={{ background: channel.color }}
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${channel.color}20`, border: `1px solid ${channel.color}30` }}
            >
              <Icon className="w-5 h-5" style={{ color: channel.color }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: channel.color }}>
                {channel.name}
              </div>
              <div className="text-[10px] text-white/35 font-mono">{channel.id}</div>
            </div>
          </div>
          <div
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
            style={{ background: `${channel.color}15`, color: channel.color, border: `1px solid ${channel.color}25` }}
          >
            ₹{channel.fee.toFixed(2)}
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/40">
            <span>Capacity</span>
            <span className="font-mono">{utilization.used}/{utilization.total}</span>
          </div>
          <AnimatedProgress
            value={percentage}
            color={channel.color}
            height={5}
            delay={index * 100}
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>Latency: {channel.latency}m</span>
            <span>{percentage.toFixed(0)}% used</span>
          </div>
        </div>

        {/* Active transactions */}
        {utilization.transactions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="text-[10px] text-white/35 mb-1.5">Active:</div>
            <div className="flex flex-wrap gap-1">
              {utilization.transactions.map((txId, i) => (
                <motion.span
                  key={txId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono"
                  style={{
                    background: `${channel.color}15`,
                    color: channel.color,
                    border: `1px solid ${channel.color}30`,
                  }}
                >
                  {txId}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
