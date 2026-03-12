import csv
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

P = 0.001
F = 0.5

CHANNELS: Dict[str, Dict[str, float]] = {
    "Channel_F": {"fee": 5.0, "cap": 2, "lat": 1},
    "Channel_S": {"fee": 1.0, "cap": 4, "lat": 3},
    "Channel_B": {"fee": 0.2, "cap": 10, "lat": 10},
}


@dataclass
class Tx:
    tx_id: str
    amount: int
    arrival: int
    max_delay: int
    priority: int


@dataclass
class Sched(Tx):
    channel_id: Optional[str]
    start: Optional[int]
    end: Optional[int]
    failed: bool
    channel_fee: float
    delay: int
    delay_penalty: float
    failure_penalty: float
    total_cost: float


def parse_csv(path: str) -> List[Tx]:
    out: List[Tx] = []
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            out.append(
                Tx(
                    tx_id=row["tx_id"],
                    amount=int(row["amount"]),
                    arrival=int(row["arrival_time"]),
                    max_delay=int(row["max_delay"]),
                    priority=int(row["priority"]),
                )
            )
    return out


def has_capacity(
    slots: List[Tuple[int, int, str]], cap: int, start: int, end: int
) -> bool:
    for t in range(start, end):
        concurrent = sum(1 for s, e, _ in slots if t >= s and t < e)
        if concurrent >= cap:
            return False
    return True


def find_earliest_slot(
    slots: List[Tuple[int, int, str]],
    cap: int,
    arrival: int,
    latency: int,
    deadline: int,
) -> Optional[int]:
    t = arrival
    while t <= deadline:
        if has_capacity(slots, cap, t, t + latency):
            return t
        t += 1
    return None


def calc_cost(tx: Tx, channel_id: str, start: int) -> Tuple[float, float, float, int]:
    fee = float(CHANNELS[channel_id]["fee"])
    delay = start - tx.arrival
    delay_pen = P * tx.amount * delay
    return fee, delay_pen, fee + delay_pen, delay


def failure_cost(tx: Tx) -> float:
    return F * tx.amount


def schedule_single(
    tx: Tx, channel_slots: Dict[str, List[Tuple[int, int, str]]], channels_to_try: List[str]
) -> Sched:
    deadline = tx.arrival + tx.max_delay
    best_channel: Optional[str] = None
    best_start: Optional[int] = None
    best_cost = float("inf")

    for ch in channels_to_try:
        lat = int(CHANNELS[ch]["lat"])
        cap = int(CHANNELS[ch]["cap"])
        st = find_earliest_slot(channel_slots[ch], cap, tx.arrival, lat, deadline)
        if st is None:
            continue
        fee, dp, total, _delay = calc_cost(tx, ch, st)
        if total < best_cost:
            best_channel = ch
            best_start = st
            best_cost = total

    fail_pen = failure_cost(tx)

    if best_channel is None or best_start is None:
        return Sched(
            **tx.__dict__,
            channel_id=None,
            start=None,
            end=None,
            failed=True,
            channel_fee=0.0,
            delay=0,
            delay_penalty=0.0,
            failure_penalty=fail_pen,
            total_cost=fail_pen,
        )

    # graceful failure (matches current TS: only for low priority)
    if fail_pen < best_cost and tx.priority <= 2:
        return Sched(
            **tx.__dict__,
            channel_id=None,
            start=None,
            end=None,
            failed=True,
            channel_fee=0.0,
            delay=0,
            delay_penalty=0.0,
            failure_penalty=fail_pen,
            total_cost=fail_pen,
        )

    lat = int(CHANNELS[best_channel]["lat"])
    end = best_start + lat
    channel_slots[best_channel].append((best_start, end, tx.tx_id))

    fee, dp, total, delay = calc_cost(tx, best_channel, best_start)
    return Sched(
        **tx.__dict__,
        channel_id=best_channel,
        start=best_start,
        end=end,
        failed=False,
        channel_fee=fee,
        delay=delay,
        delay_penalty=dp,
        failure_penalty=0.0,
        total_cost=total,
    )


def run_edf(txs: List[Tx]) -> List[Sched]:
    sorted_txs = sorted(
        txs, key=lambda t: (t.arrival + t.max_delay, -t.priority, -t.amount)
    )
    slots: Dict[str, List[Tuple[int, int, str]]] = {ch: [] for ch in CHANNELS}
    return [schedule_single(tx, slots, list(CHANNELS.keys())) for tx in sorted_txs]


def run_threshold(txs: List[Tx]) -> List[Sched]:
    sorted_txs = sorted(txs, key=lambda t: t.arrival)
    slots: Dict[str, List[Tuple[int, int, str]]] = {ch: [] for ch in CHANNELS}
    out: List[Sched] = []
    for tx in sorted_txs:
        urgency = tx.max_delay <= 5 or tx.priority >= 4
        high_value = tx.amount > 5000

        preferred: Optional[str] = None
        if high_value and urgency:
            preferred = "Channel_F"
        elif tx.amount >= 1000 or tx.priority >= 3:
            preferred = "Channel_S"
        elif tx.max_delay > 20 and tx.priority <= 2:
            preferred = "Channel_B"

        order = (
            [preferred] + [c for c in CHANNELS.keys() if c != preferred]
            if preferred
            else list(CHANNELS.keys())
        )
        out.append(schedule_single(tx, slots, order))
    return out


def total_cost(s: List[Sched]) -> float:
    return sum(x.total_cost for x in s)


def average_delay(s: List[Sched]) -> float:
    succ = [x for x in s if not x.failed]
    return sum(x.delay for x in succ) / len(succ) if succ else 0.0


def tx_id_num(tx_id: str) -> int:
    # e.g. T22 -> 22
    digits = "".join(ch for ch in tx_id if ch.isdigit())
    return int(digits) if digits else 0


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path")
    args = ap.parse_args()

    txs = parse_csv(args.csv_path)
    edf = run_edf(txs)
    thr = run_threshold(txs)
    cedf = total_cost(edf)
    cthr = total_cost(thr)

    winner = "edf" if cedf <= cthr else "threshold"
    best = edf if winner == "edf" else thr

    best_by_id = {x.tx_id: x for x in best}

    print(f"Transactions: {len(txs)}")
    print(f"EDF total: {cedf:.2f}")
    print(f"Threshold total: {cthr:.2f}")
    print(f"Hybrid selects: {winner} (total {total_cost(best):.2f})")
    print()

    header = [
        "tx_id",
        "priority",
        "amount",
        "arrival",
        "deadline",
        "channel",
        "start",
        "end",
        "delay",
        "channel_fee",
        "delay_penalty",
        "failure_penalty",
        "total_cost",
    ]
    print("\t".join(header))

    for tx in sorted(txs, key=lambda t: tx_id_num(t.tx_id)):
        s = best_by_id[tx.tx_id]
        deadline = s.arrival + s.max_delay
        print(
            "\t".join(
                [
                    s.tx_id,
                    str(s.priority),
                    str(s.amount),
                    str(s.arrival),
                    str(deadline),
                    s.channel_id if s.channel_id is not None else "FAILED",
                    str(s.start) if s.start is not None else "-",
                    str(s.end) if s.end is not None else "-",
                    str(s.delay),
                    f"{s.channel_fee:.2f}",
                    f"{s.delay_penalty:.2f}",
                    f"{s.failure_penalty:.2f}",
                    f"{s.total_cost:.2f}",
                ]
            )
        )

    succ = sum(1 for x in best if not x.failed)
    fail = sum(1 for x in best if x.failed)
    fees = sum(x.channel_fee for x in best)
    dp = sum(x.delay_penalty for x in best)
    fp = sum(x.failure_penalty for x in best)

    print()
    print("Summary")
    print(f"- algorithm_used: {winner}")
    print(f"- successful_transactions: {succ}")
    print(f"- failed_transactions: {fail}")
    print(f"- average_delay: {average_delay(best):.2f}m")
    print(f"- total_cost: {total_cost(best):.2f}")
    print(f"- channel_fees: {fees:.2f}")
    print(f"- delay_penalties: {dp:.2f}")
    print(f"- failure_penalties: {fp:.2f}")


if __name__ == "__main__":
    main()
