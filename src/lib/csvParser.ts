import type { Transaction } from '@/types';

export function parseTransactionsCSV(csvContent: string): Transaction[] {
  const lines = csvContent.trim().split('\n');
  // Skip header line
  if (lines.length < 2) return [];

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < 5) continue;

    const tx: Transaction = {
      tx_id: values[0],
      amount: parseInt(values[1], 10),
      arrival_time: parseInt(values[2], 10),
      max_delay: parseInt(values[3], 10),
      priority: parseInt(values[4], 10),
    };

    if (
      !isNaN(tx.amount) &&
      !isNaN(tx.arrival_time) &&
      !isNaN(tx.max_delay) &&
      !isNaN(tx.priority)
    ) {
      transactions.push(tx);
    }
  }

  return transactions;
}

export function generateSampleCSV(): string {
  return `tx_id,amount,arrival_time,max_delay,priority
T1,10000,0,10,5
T2,500,1,30,2
T3,2000,2,5,4
T4,15000,3,2,5
T5,250,5,60,1
T6,8000,6,8,4
T7,1200,7,3,3
T8,600,7,15,2`;
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
