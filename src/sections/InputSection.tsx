import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, RotateCcw, Sparkles, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { GlassCard } from '@/components/GlassCard';
import { staggerContainer, fadeInUp, tabEnter, buttonTapProps } from '@/lib/animations';
import type { Transaction } from '@/types';
import { toast } from 'sonner';
import { parseTransactionsCSV, generateSampleCSV, downloadCSV } from '@/lib/csvParser';
import { SAMPLE_TRANSACTIONS } from '@/types';
import type { AlgorithmMode } from '@/types';

interface InputSectionProps {
  transactions: Transaction[];
  onTransactionsChange: (txs: Transaction[]) => void;
  algorithm: AlgorithmMode;
  onAlgorithmChange: (a: AlgorithmMode) => void;
}

export function InputSection({
  transactions,
  onTransactionsChange,
  algorithm,
  onAlgorithmChange,
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transactionListOpen, setTransactionListOpen] = useState(true);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseTransactionsCSV(e.target?.result as string);
        if (!parsed.length) { toast.error('No valid transactions found'); return; }
        onTransactionsChange(parsed);
        toast.success(`Loaded ${parsed.length} transactions`);
      } catch { toast.error('Failed to parse CSV'); }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      variants={tabEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-1 space-y-4">

          {/* Data Input Card */}
          <GlassCard glowColor="#22C55E">
            <motion.h3 variants={fadeInUp} className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#22C55E18' }}>
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              Data Input
            </motion.h3>
            <motion.div variants={staggerContainer} className="space-y-2.5">
              {[
                {
                  label: 'Upload CSV', icon: Upload, color: '#22C55E',
                  onClick: () => fileInputRef.current?.click(),
                },
                {
                  label: 'Download Sample', icon: FileSpreadsheet, color: '#3b82f6',
                  onClick: () => { downloadCSV(generateSampleCSV(), 'sample_transactions.csv'); toast.success('Sample downloaded'); },
                },
                {
                  label: 'Reset to Sample', icon: RotateCcw, color: '#F59E0B',
                  onClick: () => { onTransactionsChange(SAMPLE_TRANSACTIONS); toast.success('Sample data restored'); },
                },
              ].map(({ label, icon: Icon, color, onClick }) => (
                <motion.div key={label} variants={fadeInUp}>
                  <motion.button
                    onClick={onClick}
                    {...buttonTapProps}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 hover:border-white/15 hover:bg-white/5 transition-all text-sm font-medium text-white/70 hover:text-white"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    {label}
                  </motion.button>
                </motion.div>
              ))}
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </motion.div>
          </GlassCard>

          {/* Algorithm Selection */}
          <GlassCard glowColor="#7C3AED">
            <motion.h3 variants={fadeInUp} className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED18' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              Algorithm
            </motion.h3>
            <motion.div variants={staggerContainer} className="space-y-2">
              <motion.div variants={fadeInUp}>
                <motion.button
                  onClick={() => onAlgorithmChange('hybrid')}
                  {...buttonTapProps}
                  className="w-full p-4 rounded-xl border text-left transition-all border-white/20 bg-white/6"
                  style={{
                    borderColor: '#7C3AED40',
                    background: '#7C3AED08',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hybrid (Best of Both)</span>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    </motion.div>
                  </div>
                  <p className="text-xs text-white/35 mt-1">
                    Combination of <span className="text-white/60 font-medium">EDF</span> (deadline-first) and
                    <span className="text-white/60 font-medium"> Threshold</span> (rule-based). Runs both and selects the lowest-cost schedule.
                  </p>
                </motion.button>
              </motion.div>
              {algorithm !== 'hybrid' && (
                <motion.p variants={fadeInUp} className="text-[11px] text-amber-300/70 px-1">
                  Algorithm selection is locked to Hybrid for best performance.
                </motion.p>
              )}
            </motion.div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard>
            <motion.h3 variants={fadeInUp} className="text-sm font-semibold mb-4 text-white/70">Quick Stats</motion.h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Transactions', value: transactions.length, color: '#22C55E' },
                {
                  label: 'Total Value',
                  value: `₹${transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}`,
                  color: '#3b82f6',
                },
              ].map(({ label, value, color }) => (
                <motion.div key={label} variants={fadeInUp} className="text-center p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
                  <div className="text-xl font-bold number-mono" style={{ color }}>{value}</div>
                  <div className="text-[10px] text-white/35 mt-0.5">{label}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Transaction Table (collapsible) */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard noPadding glowColor="#7C3AED">
            <button
              type="button"
              onClick={() => setTransactionListOpen((o) => !o)}
              className="card-header-highlight w-full px-5 py-4 border-b border-white/5 flex items-center justify-between text-left hover:bg-white/5 transition-colors rounded-t-2xl"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {transactionListOpen ? (
                  <ChevronUp className="w-4 h-4 text-white/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/50" />
                )}
                Transaction List
              </h3>
              <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                {transactions.length} records
              </Badge>
            </button>
            <AnimatePresence initial={false}>
              {transactionListOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-[rgba(10,10,20,0.8)] backdrop-blur-sm">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          {['TX ID', 'Amount', 'Arrival', 'Max Delay', 'Priority', 'Deadline'].map((h, i) => (
                            <TableHead key={h} className={`text-[11px] text-white/35 font-semibold uppercase tracking-wider py-3 ${i > 0 ? 'text-right' : ''}`}>
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx, i) => (
                          <motion.tr
                            key={tx.tx_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="table-row-hover border-white/4 group"
                          >
                            <TableCell className="font-mono text-emerald-400 font-medium text-sm py-3">{tx.tx_id}</TableCell>
                            <TableCell className="text-right font-mono text-sm">₹{tx.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-xs font-mono text-white/60">{tx.arrival_time}m</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-xs font-mono text-white/60">{tx.max_delay}m</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className="px-2 py-0.5 rounded-lg text-xs font-bold"
                                style={tx.priority >= 4
                                  ? { background: '#22C55E18', color: '#22C55E', border: '1px solid #22C55E30' }
                                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
                                }
                              >
                                P{tx.priority}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-xs font-mono text-white/40">{tx.arrival_time + tx.max_delay}m</span>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
