import type { ScheduledTransaction, CostBreakdown, Channel } from '@/types';
import { CHANNELS, PENALTY_FACTOR, FAILURE_PENALTY_FACTOR } from '@/types';

const VALID_CHANNEL_IDS = new Set<string>(['Channel_F', 'Channel_S', 'Channel_B']);
const COST_TOLERANCE = 0.01;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Runs all constraint checks from the judge contract.
 * Call before generating submission.json to catch disqualification conditions.
 */
export function validateConstraints(
  scheduledTransactions: ScheduledTransaction[],
  costBreakdown: CostBreakdown,
  channels: Channel[] = CHANNELS
): ValidationResult {
  const errors: string[] = [];

  // ─── CHECK 1: No early starts ─────────────────────────────────────────
  for (const tx of scheduledTransactions) {
    if (tx.failed || tx.start_time === null) continue;
    if (tx.start_time < tx.arrival_time) {
      errors.push(
        `CHECK 1 failed: ${tx.tx_id} has start_time ${tx.start_time} < arrival_time ${tx.arrival_time}`
      );
    }
  }

  // ─── CHECK 2: No capacity violations ───────────────────────────────────
  const successful = scheduledTransactions.filter((t) => !t.failed && t.channel_id != null && t.start_time != null && t.end_time != null);
  const maxTime = successful.length > 0
    ? Math.max(...successful.map((t) => t.end_time!))
    : 0;

  for (const channel of channels) {
    for (let t = 0; t <= maxTime; t++) {
      const active = successful.filter(
        (tx) =>
          tx.channel_id === channel.id &&
          t >= tx.start_time! &&
          t < tx.end_time!
      );
      if (active.length > channel.capacity) {
        errors.push(
          `CHECK 2 failed: ${channel.id} at time ${t} has ${active.length} concurrent (max ${channel.capacity})`
        );
        break; // one violation per channel is enough
      }
    }
  }

  // ─── CHECK 3: Complete coverage, no duplicates ──────────────────────────
  const txIds = scheduledTransactions.map((t) => t.tx_id);
  const uniqueIds = new Set(txIds);
  if (uniqueIds.size !== txIds.length) {
    const duplicates = txIds.filter((id, i) => txIds.indexOf(id) !== i);
    errors.push(`CHECK 3 failed: Duplicate tx_id(s): ${[...new Set(duplicates)].join(', ')}`);
  }
  if (scheduledTransactions.length === 0) {
    errors.push('CHECK 3 failed: No transactions in assignments');
  }

  // ─── CHECK 4: Valid channel IDs ──────────────────────────────────────────
  for (const tx of scheduledTransactions) {
    if (tx.failed) {
      if (tx.channel_id !== null) {
        errors.push(`CHECK 4 failed: ${tx.tx_id} is failed but has channel_id ${tx.channel_id}`);
      }
      continue;
    }
    if (tx.channel_id !== null && !VALID_CHANNEL_IDS.has(tx.channel_id)) {
      errors.push(`CHECK 4 failed: ${tx.tx_id} has invalid channel_id "${tx.channel_id}"`);
    }
  }

  // ─── CHECK 5: Integer start times ────────────────────────────────────────
  for (const tx of scheduledTransactions) {
    if (tx.failed || tx.start_time === null) continue;
    if (!Number.isInteger(tx.start_time)) {
      errors.push(`CHECK 5 failed: ${tx.tx_id} has non-integer start_time ${tx.start_time}`);
    }
  }

  // ─── CHECK 6: Cost estimate accuracy ────────────────────────────────────
  let recomputedTotal = 0;
  for (const tx of scheduledTransactions) {
    if (tx.failed) {
      recomputedTotal += FAILURE_PENALTY_FACTOR * tx.amount;
    } else {
      const channelFee = channels.find((c) => c.id === tx.channel_id)?.fee ?? 0;
      const delay = (tx.start_time ?? 0) - tx.arrival_time;
      const delayPenalty = PENALTY_FACTOR * tx.amount * delay;
      recomputedTotal += channelFee + delayPenalty;
    }
  }
  const diff = Math.abs(costBreakdown.total - recomputedTotal);
  if (diff > COST_TOLERANCE) {
    errors.push(
      `CHECK 6 failed: total_system_cost_estimate ${costBreakdown.total.toFixed(2)} does not match recomputed ${recomputedTotal.toFixed(2)} (diff ${diff.toFixed(2)} > ${COST_TOLERANCE})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
