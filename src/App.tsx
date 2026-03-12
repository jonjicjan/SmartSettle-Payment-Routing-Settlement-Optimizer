import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';

// Layout
import { TopNav } from '@/components/TopNav';
import { Sidebar } from '@/components/Sidebar';

// Sections
import { InputSection }      from '@/sections/InputSection';
import { ScheduleSection }   from '@/sections/ScheduleSection';
import { SimulationSection } from '@/sections/SimulationSection';
import { ResultsSection }    from '@/sections/ResultsSection';

// Data / logic
import type { Transaction, ScheduledTransaction, CostBreakdown } from '@/types';
import { CHANNELS, SAMPLE_TRANSACTIONS } from '@/types';
import { scheduler } from '@/lib/scheduler';
import { hybrid_scheduler, type HybridResult } from '@/lib/hybridScheduler';
import type { AlgorithmMode, AlgorithmUsed } from '@/types';

// ─── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [transactions, setTransactions]               = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>([]);
  const [costBreakdown, setCostBreakdown]             = useState<CostBreakdown | null>(null);
  const [currentTime, setCurrentTime]                 = useState(0);
  const [isSimulating, setIsSimulating]               = useState(false);
  const [simulationSpeed, setSimulationSpeed]         = useState(500);
  const [activeTab, setActiveTab]                     = useState('input');
  const [algorithm, setAlgorithm]                     = useState<AlgorithmMode>('hybrid');
  const [algorithmUsed, setAlgorithmUsed]             = useState<AlgorithmUsed>('edf');
  const [lastHybridResult, setLastHybridResult]      = useState<HybridResult | null>(null);
  const [isOptimizing, setIsOptimizing]              = useState(false);

  const maxTime = Math.max(
    ...scheduledTransactions.map((tx) =>
      tx.failed ? tx.arrival_time + tx.max_delay : tx.end_time ?? 0
    ),
    100
  );

  // ── Run scheduling ──────────────────────────────────────────────────────────
  const runScheduling = useCallback(() => {
    if (algorithm === 'hybrid') {
      const hybridResult = hybrid_scheduler(transactions);
      setAlgorithmUsed(hybridResult.algorithm_used);
      setLastHybridResult(hybridResult);
      setScheduledTransactions(scheduler.getScheduledTransactions());
      setCostBreakdown(scheduler.getCostBreakdown());
    } else {
      setLastHybridResult(null);
      setAlgorithmUsed(algorithm);
      scheduler.setTransactions(transactions);
      const result =
        algorithm === 'edf'
          ? scheduler.schedule()
          : scheduler.scheduleWithThresholds();
      setScheduledTransactions(result);
      setCostBreakdown(scheduler.getCostBreakdown());
    }
  }, [transactions, algorithm]);

  useEffect(() => {
    setIsOptimizing(true);
    runScheduling();
    const t = setTimeout(() => setIsOptimizing(false), 500);
    return () => clearTimeout(t);
  }, [runScheduling]);

  // ── Simulation timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= maxTime) { setIsSimulating(false); return prev; }
        return prev + 1;
      });
    }, simulationSpeed);
    return () => clearInterval(interval);
  }, [isSimulating, maxTime, simulationSpeed]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getChannelUtilization = (channelId: string) =>
    scheduler.getChannelUtilization(channelId, currentTime);

  const getActiveTransactions = () =>
    scheduledTransactions.filter(
      (tx) =>
        !tx.failed &&
        tx.start_time !== null &&
        tx.end_time !== null &&
        currentTime >= tx.start_time &&
        currentTime < tx.end_time
    );

  const getPendingTransactions = () =>
    scheduledTransactions.filter(
      (tx) => !tx.failed && tx.start_time !== null && tx.start_time > currentTime
    );

  const getCompletedTransactions = () =>
    scheduledTransactions.filter(
      (tx) => !tx.failed && tx.end_time !== null && currentTime >= tx.end_time
    );

  const getFailedTransactions = () =>
    scheduledTransactions.filter((tx) => tx.failed);

  const successCount = scheduledTransactions.filter((t) => !t.failed).length;
  const successRate =
    scheduledTransactions.length > 0
      ? (successCount / scheduledTransactions.length) * 100
      : 0;

  // ── Tab content map ─────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'input':
        return (
          <InputSection
            key="input"
            transactions={transactions}
            onTransactionsChange={(txs) => { setTransactions(txs); }}
            algorithm={algorithm}
            onAlgorithmChange={setAlgorithm}
          />
        );
      case 'schedule':
        return (
          <ScheduleSection
            key="schedule"
            scheduledTransactions={scheduledTransactions}
          />
        );
      case 'simulation':
        return (
          <SimulationSection
            key="simulation"
            scheduledTransactions={scheduledTransactions}
            currentTime={currentTime}
            maxTime={maxTime}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
            algorithm={algorithm}
            algorithmUsed={algorithmUsed}
            onSimulateToggle={() => setIsSimulating((p) => !p)}
            onReset={() => { setIsSimulating(false); setCurrentTime(0); }}
            onSpeedChange={setSimulationSpeed}
            getChannelUtilization={getChannelUtilization}
            getActiveTransactions={getActiveTransactions}
            getPendingTransactions={getPendingTransactions}
            getCompletedTransactions={getCompletedTransactions}
            getFailedTransactions={getFailedTransactions}
          />
        );
      case 'results':
        return (
          <ResultsSection
            key="results"
            costBreakdown={costBreakdown}
            scheduledTransactions={scheduledTransactions}
            algorithm={algorithm}
            algorithmUsed={algorithmUsed}
            lastHybridResult={lastHybridResult}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Ambient blurred accent lights */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden
      >
        <div
          className="absolute w-[400px] h-[400px] rounded-full -top-32 -left-32"
          style={{
            background: '#7C3AED',
            filter: 'blur(120px)',
            opacity: 0.18,
          }}
        />
        <div
          className="absolute w-[380px] h-[380px] rounded-full -bottom-32 -right-32"
          style={{
            background: '#06B6D4',
            filter: 'blur(120px)',
            opacity: 0.18,
          }}
        />
      </div>

      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCost={costBreakdown?.total}
        successRate={successRate}
        isOptimizing={isOptimizing}
      />

      <div className="flex relative z-10">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden lg:flex">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            channels={CHANNELS}
            algorithm={algorithm}
            algorithmUsed={algorithmUsed}
            onAlgorithmChange={setAlgorithm}
            totalTransactions={transactions.length}
            totalValue={transactions.reduce((s, t) => s + t.amount, 0)}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-5 md:p-8 overflow-hidden">
          <div className="max-w-6xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {renderTab()}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-5">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-white/30 font-medium">
            SmartSettle — Payment Routing & Settlement Optimizer
          </p>
          <p className="text-[11px] text-white/25 font-mono">
            P = 0.001 · F = 0.5
          </p>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(15,15,30,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
          },
        }}
      />
    </div>
  );
}

export default App;
