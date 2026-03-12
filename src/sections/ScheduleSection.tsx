import { motion } from 'framer-motion';
import { Calculator, CheckCircle, XCircle, Zap, Clock, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { GlassCard } from '@/components/GlassCard';
import { tabEnter, fadeInUp } from '@/lib/animations';
import type { ScheduledTransaction } from '@/types';

interface ScheduleSectionProps {
  scheduledTransactions: ScheduledTransaction[];
}

const CHANNEL_STYLE: Record<string, { bg: string; text: string; border: string; Icon: typeof Zap }> = {
  Channel_F: { bg: '#22C55E18', text: '#22C55E', border: '#22C55E30', Icon: Zap },
  Channel_S: { bg: '#3b82f618', text: '#3b82f6', border: '#3b82f630', Icon: Clock },
  Channel_B: { bg: '#f59e0b18', text: '#f59e0b', border: '#f59e0b30', Icon: Package },
};

export function ScheduleSection({ scheduledTransactions }: ScheduleSectionProps) {
  const successCount = scheduledTransactions.filter((t) => !t.failed).length;
  const failedCount  = scheduledTransactions.filter((t) => t.failed).length;

  return (
    <motion.div variants={tabEnter} initial="hidden" animate="visible" exit="exit">
      <GlassCard noPadding>
        {/* Header */}
        <div className="card-header-highlight px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#3b82f618' }}>
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
            </div>
            Scheduled Transactions
          </h3>
          <div className="flex items-center gap-2">
            <span className="chip-success flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {successCount}
            </span>
            {failedCount > 0 && (
              <span className="chip-danger flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {failedCount}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <Table>
            <TableHeader className="table-sticky-header">
              <TableRow className="border-white/5 hover:bg-transparent">
                {['TX ID','Amount','Channel','Start','End','Delay','Fee','Penalty','Total'].map((h, i) => (
                  <TableHead key={h} className={`text-[10px] text-white/30 font-semibold uppercase tracking-wider py-3 ${i > 0 ? 'text-right' : ''}`}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledTransactions.map((tx, i) => (
                <motion.tr
                  key={tx.tx_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={`table-row-hover ${tx.failed ? 'bg-red-950/10' : ''}`}
                >
                  <TableCell className="font-mono text-emerald-400 font-medium text-sm py-3">{tx.tx_id}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{tx.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {tx.failed ? (
                      <span className="chip-danger flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> FAILED
                      </span>
                    ) : tx.channel_id ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                        style={{
                          background: CHANNEL_STYLE[tx.channel_id]?.bg,
                          color: CHANNEL_STYLE[tx.channel_id]?.text,
                          border: `1px solid ${CHANNEL_STYLE[tx.channel_id]?.border}`,
                        }}
                      >
                        {(() => { const { Icon } = CHANNEL_STYLE[tx.channel_id]; return <Icon className="w-3 h-3" />; })()}
                        {tx.channel_id.replace('Channel_', '')}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.start_time !== null
                      ? <span className="px-1.5 py-0.5 rounded bg-white/5 text-xs font-mono">{tx.start_time}m</span>
                      : <span className="text-white/25">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.end_time !== null
                      ? <span className="px-1.5 py-0.5 rounded bg-white/5 text-xs font-mono">{tx.end_time}m</span>
                      : <span className="text-white/25">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.failed
                      ? <span className="text-white/25">-</span>
                      : <span className="text-amber-400 text-sm font-mono">{tx.delay}m</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {tx.failed ? <span className="text-white/25">-</span> : `₹${tx.channel_fee.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {tx.failed
                      ? <span className="text-red-400">₹{tx.failure_penalty.toFixed(2)}</span>
                      : `₹${tx.delay_penalty.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">₹{tx.total_cost.toFixed(2)}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </motion.div>
  );
}
