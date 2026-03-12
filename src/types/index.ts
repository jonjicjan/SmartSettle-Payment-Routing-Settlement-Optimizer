// SmartSettle Types

export interface Transaction {
  tx_id: string;
  amount: number;
  arrival_time: number;
  max_delay: number;
  priority: number;
}

export interface Channel {
  id: 'Channel_F' | 'Channel_S' | 'Channel_B';
  name: string;
  fee: number;
  capacity: number;
  latency: number;
  color: string;
}

export interface Assignment {
  tx_id: string;
  channel_id: 'Channel_F' | 'Channel_S' | 'Channel_B' | null;
  start_time: number | null;
  failed?: boolean;
}

export interface ScheduledTransaction extends Transaction {
  channel_id: 'Channel_F' | 'Channel_S' | 'Channel_B' | null;
  start_time: number | null;
  end_time: number | null;
  failed: boolean;
  channel_fee: number;
  delay: number;
  delay_penalty: number;
  failure_penalty: number;
  total_cost: number;
}

export interface ChannelSlot {
  tx_id: string;
  start_time: number;
  end_time: number;
}

export interface ChannelState {
  slots: ChannelSlot[];
}

export interface CostBreakdown {
  channel_fees: number;
  delay_penalties: number;
  failure_penalties: number;
  total: number;
}

export interface SimulationState {
  currentTime: number;
  isRunning: boolean;
  speed: number;
}

/** Selected scheduler mode: single algorithm or hybrid (run both, pick best) */
export type AlgorithmMode = 'edf' | 'threshold' | 'hybrid';
/** Which algorithm produced the current schedule (after hybrid selection) */
export type AlgorithmUsed = 'edf' | 'threshold';

export const CHANNELS: Channel[] = [
  {
    id: 'Channel_F',
    name: 'FAST',
    fee: 5.0,
    capacity: 2,
    latency: 1,
    color: '#10b981', // emerald-500
  },
  {
    id: 'Channel_S',
    name: 'STANDARD',
    fee: 1.0,
    capacity: 4,
    latency: 3,
    color: '#3b82f6', // blue-500
  },
  {
    id: 'Channel_B',
    name: 'BULK',
    fee: 0.2,
    capacity: 10,
    latency: 10,
    color: '#f59e0b', // amber-500
  },
];

export const PENALTY_FACTOR = 0.001;
export const FAILURE_PENALTY_FACTOR = 0.5;

// Sample transactions for testing
export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { tx_id: 'T1', amount: 10000, arrival_time: 0, max_delay: 10, priority: 5 },
  { tx_id: 'T2', amount: 500, arrival_time: 1, max_delay: 30, priority: 2 },
  { tx_id: 'T3', amount: 2000, arrival_time: 2, max_delay: 5, priority: 4 },
  { tx_id: 'T4', amount: 15000, arrival_time: 3, max_delay: 2, priority: 5 },
  { tx_id: 'T5', amount: 250, arrival_time: 5, max_delay: 60, priority: 1 },
  { tx_id: 'T6', amount: 8000, arrival_time: 6, max_delay: 8, priority: 4 },
  { tx_id: 'T7', amount: 1200, arrival_time: 7, max_delay: 3, priority: 3 },
  { tx_id: 'T8', amount: 600, arrival_time: 7, max_delay: 15, priority: 2 },
];
