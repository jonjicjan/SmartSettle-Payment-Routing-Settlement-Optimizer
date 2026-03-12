import type {
  Transaction,
  Channel,
  Assignment,
  ScheduledTransaction,
  ChannelState,
  CostBreakdown,
} from '@/types';
import {
  CHANNELS,
  PENALTY_FACTOR,
  FAILURE_PENALTY_FACTOR,
} from '@/types';

export class PaymentScheduler {
  private channelStates: Map<string, ChannelState> = new Map();
  private scheduledTransactions: ScheduledTransaction[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    // Initialize channel states
    CHANNELS.forEach((channel) => {
      this.channelStates.set(channel.id, { slots: [] });
    });
  }

  reset() {
    this.channelStates.clear();
    this.scheduledTransactions = [];
    CHANNELS.forEach((channel) => {
      this.channelStates.set(channel.id, { slots: [] });
    });
  }

  setTransactions(transactions: Transaction[]) {
    this.transactions = [...transactions].sort(
      (a, b) => a.arrival_time - b.arrival_time
    );
  }

  // Check if a channel has capacity at a given time
  private hasCapacity(
    channelId: string,
    startTime: number,
    endTime: number
  ): boolean {
    const channel = CHANNELS.find((c) => c.id === channelId);
    if (!channel) return false;

    const state = this.channelStates.get(channelId);
    if (!state) return false;

    // Check each minute in the range
    for (let t = startTime; t < endTime; t++) {
      const concurrent = state.slots.filter(
        (slot) => t >= slot.start_time && t < slot.end_time
      ).length;
      if (concurrent >= channel.capacity) {
        return false;
      }
    }
    return true;
  }

  // Find the earliest available slot for a transaction on a channel
  private findEarliestSlot(
    channelId: string,
    arrivalTime: number,
    latency: number
  ): number | null {
    let startTime = arrivalTime;
    const maxSearchTime = arrivalTime + 1000; // Prevent infinite loop

    while (startTime < maxSearchTime) {
      const endTime = startTime + latency;
      if (this.hasCapacity(channelId, startTime, endTime)) {
        return startTime;
      }
      startTime++;
    }
    return null;
  }

  // Calculate cost for a transaction on a channel at a specific start time
  private calculateCost(
    transaction: Transaction,
    channel: Channel,
    startTime: number
  ): { channelFee: number; delayPenalty: number; total: number } {
    const channelFee = channel.fee;
    const delay = startTime - transaction.arrival_time;
    const delayPenalty = PENALTY_FACTOR * transaction.amount * delay;
    return {
      channelFee,
      delayPenalty,
      total: channelFee + delayPenalty,
    };
  }

  // Calculate failure penalty
  private calculateFailurePenalty(transaction: Transaction): number {
    return FAILURE_PENALTY_FACTOR * transaction.amount;
  }

  // Schedule a single transaction
  private scheduleTransaction(
    transaction: Transaction
  ): ScheduledTransaction {
    const deadline = transaction.arrival_time + transaction.max_delay;
    let bestOption: {
      channelId: string | null;
      startTime: number | null;
      cost: number;
    } = { channelId: null, startTime: null, cost: Infinity };

    // Try each channel
    for (const channel of CHANNELS) {
      const startTime = this.findEarliestSlot(
        channel.id,
        transaction.arrival_time,
        channel.latency
      );

      if (startTime !== null && startTime <= deadline) {
        const cost = this.calculateCost(transaction, channel, startTime);
        if (cost.total < bestOption.cost) {
          bestOption = {
            channelId: channel.id,
            startTime,
            cost: cost.total,
          };
        }
      }
    }

    // Check if failing is cheaper than best option
    const failurePenalty = this.calculateFailurePenalty(transaction);

    if (bestOption.channelId === null || bestOption.startTime === null) {
      // No valid slot found - transaction fails
      return {
        ...transaction,
        channel_id: null,
        start_time: null,
        end_time: null,
        failed: true,
        channel_fee: 0,
        delay: 0,
        delay_penalty: 0,
        failure_penalty: failurePenalty,
        total_cost: failurePenalty,
      };
    }

    // Check if we should deliberately fail this transaction
    if (failurePenalty < bestOption.cost && transaction.priority <= 2) {
      return {
        ...transaction,
        channel_id: null,
        start_time: null,
        end_time: null,
        failed: true,
        channel_fee: 0,
        delay: 0,
        delay_penalty: 0,
        failure_penalty: failurePenalty,
        total_cost: failurePenalty,
      };
    }

    // Schedule on best channel
    const channel = CHANNELS.find((c) => c.id === bestOption.channelId)!;
    const endTime = bestOption.startTime! + channel.latency;

    // Add to channel state
    const state = this.channelStates.get(bestOption.channelId)!;
    state.slots.push({
      tx_id: transaction.tx_id,
      start_time: bestOption.startTime!,
      end_time: endTime,
    });

    const cost = this.calculateCost(
      transaction,
      channel,
      bestOption.startTime!
    );

    return {
      ...transaction,
      channel_id: bestOption.channelId as 'Channel_F' | 'Channel_S' | 'Channel_B',
      start_time: bestOption.startTime,
      end_time: endTime,
      failed: false,
      channel_fee: cost.channelFee,
      delay: bestOption.startTime! - transaction.arrival_time,
      delay_penalty: cost.delayPenalty,
      failure_penalty: 0,
      total_cost: cost.total,
    };
  }

  // Run the scheduling algorithm with EDF (Earliest Deadline First)
  schedule(): ScheduledTransaction[] {
    this.reset();

    // Sort by deadline (EDF), then by priority (higher first), then by amount (higher first)
    const sortedTransactions = [...this.transactions].sort((a, b) => {
      const deadlineA = a.arrival_time + a.max_delay;
      const deadlineB = b.arrival_time + b.max_delay;

      if (deadlineA !== deadlineB) {
        return deadlineA - deadlineB;
      }
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.amount - a.amount;
    });

    this.scheduledTransactions = sortedTransactions.map((tx) =>
      this.scheduleTransaction(tx)
    );

    return this.scheduledTransactions;
  }

  // Run scheduling with threshold-based routing
  scheduleWithThresholds(): ScheduledTransaction[] {
    this.reset();

    // Sort by arrival time
    const sortedTransactions = [...this.transactions].sort(
      (a, b) => a.arrival_time - b.arrival_time
    );

    this.scheduledTransactions = sortedTransactions.map((tx) => {
      const deadline = tx.arrival_time + tx.max_delay;
      const urgency = tx.max_delay <= 5 || tx.priority >= 4;
      const highValue = tx.amount > 5000;

      let preferredChannel: string | null = null;

      if (highValue && urgency) {
        preferredChannel = 'Channel_F';
      } else if (tx.amount >= 1000 || tx.priority >= 3) {
        preferredChannel = 'Channel_S';
      } else if (tx.max_delay > 20 && tx.priority <= 2) {
        preferredChannel = 'Channel_B';
      }

      // Try preferred channel first, then others
      const channelsToTry = preferredChannel
        ? [
            CHANNELS.find((c) => c.id === preferredChannel)!,
            ...CHANNELS.filter((c) => c.id !== preferredChannel),
          ]
        : CHANNELS;

      let bestOption: {
        channelId: string | null;
        startTime: number | null;
        cost: number;
      } = { channelId: null, startTime: null, cost: Infinity };

      for (const channel of channelsToTry) {
        const startTime = this.findEarliestSlot(
          channel.id,
          tx.arrival_time,
          channel.latency
        );

        if (startTime !== null && startTime <= deadline) {
          const cost = this.calculateCost(tx, channel, startTime);
          if (cost.total < bestOption.cost) {
            bestOption = {
              channelId: channel.id,
              startTime,
              cost: cost.total,
            };
          }
        }
      }

      const failurePenalty = this.calculateFailurePenalty(tx);

      if (bestOption.channelId === null || bestOption.startTime === null) {
        return {
          ...tx,
          channel_id: null,
          start_time: null,
          end_time: null,
          failed: true,
          channel_fee: 0,
          delay: 0,
          delay_penalty: 0,
          failure_penalty: failurePenalty,
          total_cost: failurePenalty,
        };
      }

      // Check graceful failure
      if (failurePenalty < bestOption.cost && tx.priority <= 2) {
        return {
          ...tx,
          channel_id: null,
          start_time: null,
          end_time: null,
          failed: true,
          channel_fee: 0,
          delay: 0,
          delay_penalty: 0,
          failure_penalty: failurePenalty,
          total_cost: failurePenalty,
        };
      }

      const channel = CHANNELS.find((c) => c.id === bestOption.channelId)!;
      const endTime = bestOption.startTime! + channel.latency;

      const state = this.channelStates.get(bestOption.channelId)!;
      state.slots.push({
        tx_id: tx.tx_id,
        start_time: bestOption.startTime!,
        end_time: endTime,
      });

      const cost = this.calculateCost(tx, channel, bestOption.startTime!);

      return {
        ...tx,
        channel_id: bestOption.channelId as
          | 'Channel_F'
          | 'Channel_S'
          | 'Channel_B',
        start_time: bestOption.startTime,
        end_time: endTime,
        failed: false,
        channel_fee: cost.channelFee,
        delay: bestOption.startTime! - tx.arrival_time,
        delay_penalty: cost.delayPenalty,
        failure_penalty: 0,
        total_cost: cost.total,
      };
    });

    return this.scheduledTransactions;
  }

  // Get cost breakdown
  getCostBreakdown(): CostBreakdown {
    const channelFees = this.scheduledTransactions.reduce(
      (sum, tx) => sum + tx.channel_fee,
      0
    );
    const delayPenalties = this.scheduledTransactions.reduce(
      (sum, tx) => sum + tx.delay_penalty,
      0
    );
    const failurePenalties = this.scheduledTransactions.reduce(
      (sum, tx) => sum + tx.failure_penalty,
      0
    );

    return {
      channel_fees: channelFees,
      delay_penalties: delayPenalties,
      failure_penalties: failurePenalties,
      total: channelFees + delayPenalties + failurePenalties,
    };
  }

  // Get assignments for submission
  getAssignments(): Assignment[] {
    return this.scheduledTransactions.map((tx) => ({
      tx_id: tx.tx_id,
      channel_id: tx.channel_id,
      start_time: tx.start_time,
      failed: tx.failed,
    }));
  }

  // Get channel utilization at a specific time
  getChannelUtilization(
    channelId: string,
    time: number
  ): { used: number; total: number; transactions: string[] } {
    const channel = CHANNELS.find((c) => c.id === channelId);
    if (!channel) return { used: 0, total: 0, transactions: [] };

    const state = this.channelStates.get(channelId);
    if (!state) return { used: 0, total: channel.capacity, transactions: [] };

    const activeSlots = state.slots.filter(
      (slot) => time >= slot.start_time && time < slot.end_time
    );

    return {
      used: activeSlots.length,
      total: channel.capacity,
      transactions: activeSlots.map((slot) => slot.tx_id),
    };
  }

  // Get all scheduled transactions
  getScheduledTransactions(): ScheduledTransaction[] {
    return this.scheduledTransactions;
  }

  // Get channel timeline data for visualization
  getChannelTimeline(
    channelId: string
  ): { start: number; end: number; tx_id: string }[] {
    const state = this.channelStates.get(channelId);
    if (!state) return [];
    return state.slots.map((slot) => ({
      start: slot.start_time,
      end: slot.end_time,
      tx_id: slot.tx_id,
    }));
  }
}

// Create singleton instance
export const scheduler = new PaymentScheduler();
