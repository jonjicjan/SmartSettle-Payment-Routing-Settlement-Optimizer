import type { Transaction, ScheduledTransaction } from '@/types';
import { scheduler } from '@/lib/scheduler';

// ─── Dataset statistics (pre-run intelligence) ───────────────────────────

export interface DatasetStats {
  /** Number of transactions */
  volume: number;
  /** Mean transaction amount (₹) */
  averageAmount: number;
  /** Mean max_delay (deadline slack in minutes) */
  averageDeadlineTightness: number;
  /** Lower = tighter deadlines overall */
  deadlineTightnessScore: number;
  /** Count per priority 1..5 */
  priorityDistribution: Record<number, number>;
}

/**
 * Compute dataset statistics before running algorithms.
 * Used to heuristically choose which algorithm to run first.
 */
export function computeDatasetStats(transactions: Transaction[]): DatasetStats {
  if (transactions.length === 0) {
    return {
      volume: 0,
      averageAmount: 0,
      averageDeadlineTightness: 0,
      deadlineTightnessScore: 0,
      priorityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const volume = transactions.length;
  const averageAmount =
    transactions.reduce((s, t) => s + t.amount, 0) / volume;
  const averageDeadlineTightness =
    transactions.reduce((s, t) => s + t.max_delay, 0) / volume;
  const priorityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const t of transactions) {
    if (t.priority >= 1 && t.priority <= 5) {
      priorityDistribution[t.priority]++;
    }
  }

  // Tighter deadlines → lower score → EDF likely better. Relaxed → higher → Threshold may do better.
  const deadlineTightnessScore = averageDeadlineTightness;

  return {
    volume,
    averageAmount,
    averageDeadlineTightness,
    deadlineTightnessScore,
    priorityDistribution,
  };
}

// ─── Total cost from schedule ─────────────────────────────────────────────

/**
 * Calculate total system cost from a list of scheduled transactions.
 */
export function calculate_total_cost(scheduled: ScheduledTransaction[]): number {
  return scheduled.reduce((sum, tx) => sum + tx.total_cost, 0);
}

// ─── Run individual algorithms ─────────────────────────────────────────────

export interface AlgorithmResult {
  scheduled: ScheduledTransaction[];
  totalCost: number;
}

/**
 * Run EDF (Earliest Deadline First) scheduler.
 * Sort by deadline, tie-break by priority then amount; choose cheapest feasible channel.
 */
export function run_edf_scheduler(transactions: Transaction[]): AlgorithmResult {
  scheduler.setTransactions(transactions);
  const scheduled = scheduler.schedule();
  const totalCost = calculate_total_cost(scheduled);
  return { scheduled, totalCost };
}

/**
 * Run Threshold routing scheduler.
 * Sort by arrival; prefer channel by value/urgency; choose lowest cost feasible option.
 */
export function run_threshold_scheduler(transactions: Transaction[]): AlgorithmResult {
  scheduler.setTransactions(transactions);
  const scheduled = scheduler.scheduleWithThresholds();
  const totalCost = calculate_total_cost(scheduled);
  return { scheduled, totalCost };
}

// ─── Hybrid result and schedule entry ─────────────────────────────────────

export interface ScheduleEntry {
  transaction_id: string;
  channel: string | null;
  start_time: number | null;
}

export interface HybridResult {
  algorithm_used: 'edf' | 'threshold';
  total_cost: number;
  successful_transactions: number;
  failed_transactions: number;
  average_delay: number;
  schedule: ScheduleEntry[];
  /** Stats used for heuristic (optional) */
  datasetStats?: DatasetStats;
  /** Cost from the other algorithm (for comparison) */
  edf_cost?: number;
  threshold_cost?: number;
}

function buildScheduleEntries(scheduled: ScheduledTransaction[]): ScheduleEntry[] {
  return scheduled.map((tx) => ({
    transaction_id: tx.tx_id,
    channel: tx.channel_id,
    start_time: tx.start_time,
  }));
}

/**
 * Meta-scheduler: run both EDF and Threshold, compare costs, return the optimal schedule.
 * Optionally uses dataset stats to run the most promising algorithm first (still runs both).
 */
export function hybrid_scheduler(transactions: Transaction[]): HybridResult {
  const stats = computeDatasetStats(transactions);

  if (transactions.length === 0) {
    scheduler.setTransactions([]);
    scheduler.reset();
    return {
      algorithm_used: 'edf',
      total_cost: 0,
      successful_transactions: 0,
      failed_transactions: 0,
      average_delay: 0,
      schedule: [],
      datasetStats: stats,
    };
  }

  // Heuristic: tight deadlines → EDF often wins; relaxed + varied amounts → Threshold may win.
  const runEdfFirst = stats.deadlineTightnessScore < 15;

  let edfResult: AlgorithmResult;
  let thresholdResult: AlgorithmResult;

  if (runEdfFirst) {
    edfResult = run_edf_scheduler(transactions);
    thresholdResult = run_threshold_scheduler(transactions);
  } else {
    thresholdResult = run_threshold_scheduler(transactions);
    edfResult = run_edf_scheduler(transactions);
  }

  const winner: 'edf' | 'threshold' =
    edfResult.totalCost <= thresholdResult.totalCost ? 'edf' : 'threshold';
  const winningSchedule =
    winner === 'edf' ? edfResult.scheduled : thresholdResult.scheduled;

  // Re-apply winning schedule to global scheduler state (for UI / validator)
  scheduler.setTransactions(transactions);
  if (winner === 'edf') {
    scheduler.schedule();
  } else {
    scheduler.scheduleWithThresholds();
  }

  const successful = winningSchedule.filter((t) => !t.failed).length;
  const failed = winningSchedule.filter((t) => t.failed).length;
  const successfulTxs = winningSchedule.filter((t) => !t.failed);
  const average_delay =
    successfulTxs.length > 0
      ? successfulTxs.reduce((s, t) => s + t.delay, 0) / successfulTxs.length
      : 0;

  const total_cost = calculate_total_cost(winningSchedule);

  return {
    algorithm_used: winner,
    total_cost,
    successful_transactions: successful,
    failed_transactions: failed,
    average_delay,
    schedule: buildScheduleEntries(winningSchedule),
    datasetStats: stats,
    edf_cost: edfResult.totalCost,
    threshold_cost: thresholdResult.totalCost,
  };
}
