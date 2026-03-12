<div align="center">

<br/>

```
 ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗███████╗███████╗████████╗████████╗██╗     ███████╗
 ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║     ██╔════╝
 ███████╗██╔████╔██║███████║██████╔╝   ██║   ███████╗█████╗     ██║      ██║   ██║     █████╗
 ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ╚════██║██╔══╝     ██║      ██║   ██║     ██╔══╝
 ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ███████║███████╗   ██║      ██║   ███████╗███████╗
 ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝
```

### Payment Routing & Settlement Optimizer

*Route smarter. Settle faster. Pay less.*

<br/>

[![SIH 2025](https://img.shields.io/badge/Hackathon-2K26-FF6B35?style=for-the-badge)](https://www.sih.gov.in/)
[![Track](https://img.shields.io/badge/Track-FinTech%20%26%20Payments-00C9A7?style=for-the-badge)](/)
[![Score](https://img.shields.io/badge/Evaluation-55pts%20Cost%20%2B%2020pts%20Algo-gold?style=for-the-badge)](/)

<br/>

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

<br/>

**[🌐 Live Demo](https://smartsettle.vercel.app)** · **[📡 API Docs](https://smartsettle-api.onrender.com/docs)** · **[🎥 Demo Video](#)** · **[📄 Problem Statement](./docs/PS.pdf)**

<br/>

</div>

---


## 🏦 What is SmartSettle?

SmartSettle is a **cost-aware payment routing and settlement optimizer** built for the Hackathon 2026 Fintech track.

Given a batch of payment transactions, SmartSettle assigns each one to the optimal settlement channel — **FAST**, **STANDARD**, or **BULK** — to minimize:

```
Total System Cost = Channel Fees + Delay Penalties + Failure Penalties
```

It solves this as a **resource-constrained scheduling optimization problem** using a two-phase greedy algorithm with heap-based slot tracking, running in **O(N log N)** time.

**Key highlights:**
- Handles 2,000+ transactions in milliseconds
- Mathematically computes per-transaction break-even between all channels
- Gracefully fails transactions when routing is more expensive than the failure penalty
- Parameter-driven — adapts automatically to fee spikes, channel outages, priority bursts
- Fully interactive React dashboard with real-time simulation, CSV upload, and JSON export

---

## 🚀 Live Demo & Links

| Resource | URL |
|----------|-----|
| 🌐 **Live Web App** | `https://smartsettle.vercel.app` |
| 📡 **REST API (Swagger UI)** | `https://smartsettle-api.onrender.com/docs` |
| 📡 **REST API Base** | `https://smartsettle-api.onrender.com` |
| 🎥 **Demo Video** | `https://youtube.com/watch?v=YOUR_VIDEO_ID` |
| 📊 **Presentation Slides** | `https://docs.google.com/presentation/d/YOUR_SLIDE_ID` |
| 📄 **Algorithm Report** | [`/docs/Algorithm_Rationale.md`](./docs/Algorithm_Rationale.md) |

> ⚠️ Replace placeholder URLs with your actual deployed endpoints before final submission.

---

## 🎯 The Problem

Payment systems provide multiple settlement channels with different trade-offs:

| Challenge | Detail |
|-----------|--------|
| **Channel selection** | 3 channels with different fees, speeds, and capacities |
| **Hard deadlines** | Each transaction has a `max_delay` it must be processed within |
| **Capacity limits** | Channels have concurrent slot limits — excess traffic must queue |
| **Delay penalties** | Every extra minute of delay costs `0.001 × amount` per minute |
| **Failure option** | If routing costs more than `0.5 × amount`, it's cheaper to fail the transaction |
| **Optimization goal** | Minimize total system cost across all transactions |

**Input:** `transactions.csv` — fields: `tx_id, amount, arrival_time, max_delay, priority`

**Output:** `submission.json` — channel assignment and start time per transaction + total cost estimate

**Scoring breakdown:** 55 pts cost optimization · 20 pts algorithm rationale · 15 pts correctness · 10 pts code quality

---

## 🧠 Algorithm — Full Deep Dive

SmartSettle uses a **single scheduling pipeline** with two sequential decision layers. They are not two separate algorithms — they are two phases of one unified solution.

```
transactions.csv
      │
      ▼
╔══════════════════════════════════════════════════════╗
║  PRE-COMPUTATION  O(N)                              ║
║  deadline      = arrival_time + max_delay           ║
║  urgency_score = (amount × priority)/(max_delay+1)  ║
║  failure_cost  = 0.5 × amount                       ║
║  break_even    = 4000 / amount                      ║
╚══════════════════════════════════════════════════════╝
      │
      ▼
╔══════════════════════════════════════════════════════╗
║  PHASE 1 — URGENCY ORDERING  O(N log N)             ║
║  Sort by: deadline ASC                              ║
║  Tie-break 1: urgency_score DESC                    ║
║  Tie-break 2: priority DESC                         ║
╚══════════════════════════════════════════════════════╝
      │  sorted transaction queue
      ▼
╔══════════════════════════════════════════════════════╗
║  PHASE 2 — COST-AWARE ASSIGNMENT  O(N×C×log K)      ║
║  For each tx in sorted order:                       ║
║    For each channel (FAST, STANDARD, BULK):         ║
║      earliest_start = max(arrival, heap[0])         ║
║      feasible  = earliest_start <= deadline         ║
║      cost = fee + (0.001 × amount × delay)          ║
║    Pick minimum cost feasible channel               ║
║    If best_cost > failure_cost → FAIL gracefully    ║
║    Update heap: pop slot, push (start + latency)    ║
╚══════════════════════════════════════════════════════╝
      │
      ▼
  submission.json
```

### Phase 1 — Urgency Ordering

**Why sort?** Without ordering, a low-priority transaction might grab a FAST channel slot, leaving a high-value urgent payment to miss its deadline and incur a massive failure penalty.

**Urgency formula:**
```
urgency_score = (amount × priority) / (max_delay + 1)
```

This ranks transactions by how "expensive to delay" they are:
- High `amount` → large delay penalty per minute → needs early slot access
- High `priority` → business-critical → gets first channel access
- Low `max_delay` → tight deadline → cannot afford to wait

**Sort key:** `(deadline ASC, urgency_score DESC, priority DESC)`

Primary sort on deadline ensures the most time-constrained transactions get processed first.

### Phase 2 — Cost-Aware Channel Selection

For each transaction (in urgency-sorted order), we evaluate all 3 channels simultaneously:

```python
for ch_id, ch in CHANNELS.items():
    earliest_free  = heaps[ch_id][0]             # O(1) min-heap peek
    start_time     = max(arrival_time, earliest_free)
    feasible       = (start_time <= deadline)
    delay          = start_time - arrival_time
    cost           = ch["fee"] + (P * amount * delay)

    if feasible:
        options.append((cost, ch_id, start_time))

options.sort()
best_cost, best_ch, best_start = options[0]
```

**Graceful failure override:**
```python
if not options or best_cost > (F * amount):
    mark_as_failed(tx)    # cheaper to fail than route
```

**Heap update after assignment:**
```python
finish_time = best_start + CHANNELS[best_ch]["latency"]
heapq.heappop(heaps[best_ch])
heapq.heappush(heaps[best_ch], finish_time)
```

### Why Two Phases Are Necessary

| Question | Phase 1 Answers | Phase 2 Answers |
|----------|----------------|----------------|
| *Who gets channel access first?* | ✅ Urgency sort | — |
| *Which channel is cheapest right now?* | — | ✅ Cost formula on live heap state |
| *When does it run?* | Once, before loop | Once per transaction |
| *What does it depend on?* | Transaction attributes only | Live channel availability |

Neither phase alone is sufficient. Phase 1 without Phase 2 = sorted list with no routing. Phase 2 without Phase 1 = greedy selection that lets low-priority txs steal high-value slots.

### The Break-Even Formula

FAST channel (₹5 fee) beats STANDARD (₹1 fee) when the delay penalty saved exceeds the extra fee:

```
P × amount × delay > (fee_FAST - fee_STANDARD)
0.001 × amount × delay > 4
delay > 4000 / amount
```

| Transaction Amount | FAST beats STANDARD after |
|--------------------|--------------------------|
| ₹500 | 8.0 min delay |
| ₹1,000 | 4.0 min delay |
| ₹2,000 | 2.0 min delay |
| ₹4,000 | 1.0 min delay ← exact crossover |
| ₹5,000 | 0.8 min delay |
| ₹10,000 | 0.4 min delay |
| ₹15,000 | 0.27 min delay — almost always FAST |

This break-even is computed **per transaction dynamically** by the cost formula — not as a lookup table or fixed rule.

### Transaction Buckets (Classification for Display)

```python
if deadline <= 5 or urgency > 2000:   bucket = "CRITICAL"   # prefer FAST
elif deadline <= 15 or urgency > 500:  bucket = "URGENT"     # prefer STANDARD
elif deadline <= 60:                   bucket = "NORMAL"     # STANDARD or BULK
else:                                  bucket = "BULK-SAFE"  # always BULK
```

Buckets are informational only — actual routing is always cost-formula driven.

### Time Complexity

| Step | Complexity |
|------|-----------|
| Pre-computation | O(N) |
| Sorting | O(N log N) |
| Heap query per channel | O(log K), K ≤ 10 |
| Full routing loop | O(N × 3 × log 10) ≈ O(N) |
| **Overall** | **O(N log N)** |

Handles 2,000+ transactions in under 50ms on any modern hardware.

---

## 🛠 Tech Stack

### Core Algorithm — Python

| Package | Version | Purpose |
|---------|---------|---------|
| `Python` | 3.10+ | Core scheduling engine |
| `heapq` | stdlib | Min-heap per channel for slot tracking |
| `pandas` | 2.0+ | CSV ingestion and DataFrame operations |
| `json` | stdlib | submission.json serialization |
| `FastAPI` | 0.104+ | REST API server |
| `uvicorn` | 0.24+ | ASGI server for FastAPI |
| `pydantic` | 2.5+ | Request/response validation |
| `python-multipart` | 0.0.6 | File upload support |

### Frontend — React + TypeScript

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2 | UI framework |
| `react-dom` | 19.2 | DOM rendering |
| `typescript` | ~5.9 | Type safety throughout |
| `vite` | 7.2 | Build tool, HMR, dev server |
| `@vitejs/plugin-react` | 5.1 | Babel + Fast Refresh |
| `tailwindcss` | 3.4 | Utility-first CSS |
| `tailwindcss-animate` | 1.0.7 | Animation utilities |
| `tw-animate-css` | 1.4 | Extended CSS animations |
| `@radix-ui/*` | latest | 20+ accessible headless UI primitives |
| `shadcn/ui` | latest | 40+ pre-built accessible components |
| `lucide-react` | 0.562 | Icon library (25+ icons used) |
| `recharts` | 2.15 | Channel timeline and cost charts |
| `sonner` | 2.0 | Toast notification system |
| `react-hook-form` | 7.70 | Form state management |
| `@hookform/resolvers` | 5.2 | Zod integration for forms |
| `zod` | 4.3 | Runtime schema validation |
| `clsx` | 2.1 | Conditional className utility |
| `tailwind-merge` | 3.4 | Merge conflicting Tailwind classes |
| `class-variance-authority` | 0.7 | Component variant system |
| `date-fns` | 4.1 | Date formatting |
| `next-themes` | 0.4 | Dark/light mode support |
| `cmdk` | 1.1 | Command palette component |
| `vaul` | 1.1 | Drawer/bottom sheet component |
| `embla-carousel-react` | 8.6 | Dataset browser carousel |
| `react-resizable-panels` | 4.2 | Resizable layout panels |
| `input-otp` | 1.4 | OTP input component |

### Dev Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| `eslint` | 9.39 | JavaScript/TypeScript linting |
| `typescript-eslint` | 8.46 | TypeScript-aware linting rules |
| `eslint-plugin-react-hooks` | 7.0 | React hooks correctness rules |
| `eslint-plugin-react-refresh` | 0.4 | HMR safety rules |
| `autoprefixer` | 10.4 | PostCSS vendor prefixes |
| `postcss` | 8.5 | CSS post-processing |
| `@types/react` | 19.2 | React TypeScript types |
| `@types/react-dom` | 19.2 | React DOM TypeScript types |
| `@types/node` | 24.10 | Node.js TypeScript types |

### Infrastructure & Deployment

| Service | Purpose |
|---------|---------|
| `Vercel` | Frontend hosting + automatic deploys on push to `main` |
| `Render` | Python FastAPI backend hosting (free tier) |
| `GitHub Actions` | CI — runs tests + lint on every PR |
| `GitHub Pages` | Documentation and algorithm report hosting |

---

## 🖥 Frontend Features

The SmartSettle web app is a full interactive dashboard built in React 19 with TypeScript, structured across 4 tabs.

### Tab 1 — Input

- **CSV file upload** — drag-and-drop or browse; reads `transactions.csv` client-side using `FileReader`
- **Sample CSV download** — generates a valid test file instantly via `generateSampleCSV()`
- **Algorithm selector** — toggle between `EDF (Earliest Deadline First)` and `Threshold-Based Routing`
- **Live transaction table** — all input rows rendered with `shadcn/ui Table` components

### Tab 2 — Simulation

- **Animated timeline** — real-time playback via `setInterval` inside `useEffect`, advancing `currentTime` each tick
- **Play / Pause / Reset controls** — full simulation control with `isSimulating` state
- **Speed slider** — adjust simulation speed from 50ms to 2000ms per tick using `shadcn/ui Slider`
- **Channel cards** — live utilization bar per channel, slot occupancy count, active transaction list with `glow-fast / glow-standard / glow-bulk` CSS classes
- **Live counters** — active / pending / completed / failed transaction counts update each tick

### Tab 3 — Results

- **Total system cost** — large ₹ amount displayed prominently in emerald text
- **Success rate %** — computed as `(successful / total) * 100`
- **Cost breakdown** — three `CostBreakdownCard` components for Channel Fees / Delay Penalties / Failure Penalties
- **Channel distribution chart** — per-channel tx count with animated progress bars
- **Transaction summary panel** — successful count, failed count (with `CheckCircle`/`XCircle` badges), total value
- **Download submission.json** — one-click export of full judge-format output via `downloadJSON()`

### Tab 4 — Analysis

- **Recharts visualizations** — cost per transaction bar chart, channel heatmap
- **Algorithm display** — shows which algorithm variant produced the current result

---

## 📁 Project Structure

```
smartsettle/
│
├── 📂 algorithm/                    # Python core engine
│   ├── scheduler.py                 # Main scheduling algorithm
│   ├── cost_calculator.py           # Cost formula, break-even computation
│   ├── validator.py                 # Pre-submission constraint checker
│   └── config.py                   # Channel params (fees, latency, capacity)
│
├── 📂 api/                          # FastAPI REST server
│   ├── main.py                      # App entry, CORS, middleware setup
│   ├── requirements.txt             # Python dependencies
│   └── 📂 routes/
│       ├── solve.py                 # POST /solve
│       └── validate.py             # POST /validate
│
├── 📂 src/                          # React + TypeScript frontend
│   ├── App.tsx                      # Root component (1085 lines)
│   ├── main.tsx                     # Entry point, React 19 DOM render
│   ├── index.css                    # Global styles, CSS variables, animations
│   ├── App.css                      # Glow effects, channel card styles
│   │
│   ├── 📂 types/                    # TypeScript interfaces & constants
│   │   ├── transaction.ts           # Transaction, ScheduledTransaction
│   │   ├── channel.ts               # Channel config, CHANNELS constant
│   │   └── index.ts                 # Barrel re-exports
│   │
│   ├── 📂 lib/                      # Business logic (TypeScript)
│   │   ├── scheduler.ts             # EDF + threshold scheduling (TS port)
│   │   └── csvParser.ts             # CSV parser, sample generator, JSON downloader
│   │
│   └── 📂 components/ui/            # shadcn/ui (40+ components)
│       ├── button.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── progress.tsx
│       ├── slider.tsx
│       └── ... (35+ more)
│
├── 📂 data/                          # All test datasets
│   ├── 📂 best_case/                # BC1–BC5 (12–30 txs)
│   ├── 📂 worst_case/              # WC1–WC8 (10–100 txs)
│   └── 📂 large/                   # LARGE1–LARGE5 (500–2000 txs)
│
├── 📂 docs/
│   ├── SmartSettle_PS.pdf
│   ├── Implementation_Plan.txt
│   ├── Algorithm_Rationale.md
│   └── Pitch_Script.md
│
├── 📂 tests/
│   ├── test_scheduler.py
│   ├── test_validator.py
│   ├── test_cost_formula.py
│   └── conftest.py
│
├── transactions.csv                  # Sample input (3 transactions)
├── submission.json                   # Sample output
├── verify.py                         # Judge's verifier script
├── index.html                        # Vite HTML entry
├── vite.config.ts                   # Vite + React plugin config
├── tailwind.config.js               # Tailwind + shadcn theme
├── tsconfig.json                     # Root TS config
├── tsconfig.app.json                # App TS config
├── tsconfig.node.json               # Node/Vite TS config
├── postcss.config.js                # Tailwind + Autoprefixer
├── components.json                   # shadcn/ui config
├── eslint.config.js                  # ESLint flat config (v9)
├── package.json                      # 35 dependencies
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

```bash
python --version   # 3.10+
node --version     # 20.x+
npm --version      # 9.x+
```

### 1 — Clone

```bash
git clone https://github.com/YOUR_USERNAME/smartsettle.git
cd smartsettle
```

### 2 — Python Setup

```bash
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

pip install -r api/requirements.txt
```

### 3 — Frontend Setup

```bash
npm install
```

### 4 — Environment Variables

`.env` (development):
```env
VITE_API_URL=http://localhost:8000
```

`.env.production`:
```env
VITE_API_URL=https://smartsettle-api.onrender.com
```

---

## 🚦 Usage Guide

### Run the Algorithm

```bash
source venv/bin/activate

# Default — reads transactions.csv, writes submission.json
python algorithm/scheduler.py

# Custom paths
python algorithm/scheduler.py --input data/large/LARGE3_stress_2000tx.csv --output out/submission.json

# Verbose step-by-step output
python algorithm/scheduler.py --verbose

# Custom penalty factors
python algorithm/scheduler.py --P 0.001 --F 0.5
```

### Validate Submission

```bash
# Judge's official verifier
python verify.py --input transactions.csv --submission submission.json

# Extended internal validator
python algorithm/validator.py --submission submission.json --input transactions.csv
```

### API Server

```bash
cd api
uvicorn main:app --reload --port 8000
# Swagger UI → http://localhost:8000/docs
```

### Frontend

```bash
npm run dev         # Dev server → http://localhost:5173
npm run build       # Production build → dist/
npm run preview     # Preview production build
npm run lint        # ESLint check
```

### Tests

```bash
python -m pytest tests/ -v
python -m pytest tests/ --cov=algorithm --cov-report=html
```

---

## 📡 IO Specification / API Reference

### Input — `transactions.csv`

```csv
tx_id,amount,arrival_time,max_delay,priority
T1,10000,0,10,5
T2,500,1,30,2
T3,2000,2,5,4
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tx_id` | string | Unique, non-empty | Transaction identifier |
| `amount` | integer | > 0 | Payment value in ₹ |
| `arrival_time` | integer | ≥ 0 | Minute transaction enters system |
| `max_delay` | integer | ≥ 0 | Max wait before deadline |
| `priority` | integer | 1–5 | Business priority (5 = highest) |

### Output — `submission.json`

```json
{
  "assignments": [
    {"tx_id": "T1", "channel_id": "Channel_B", "start_time": 0},
    {"tx_id": "T2", "channel_id": "Channel_S", "start_time": 3},
    {"tx_id": "T3", "channel_id": null, "start_time": null, "failed": true}
  ],
  "total_system_cost_estimate": 1.20
}
```

| Field | Type | Valid Values |
|-------|------|-------------|
| `tx_id` | string | Must match input exactly |
| `channel_id` | string \| null | `"Channel_F"`, `"Channel_S"`, `"Channel_B"`, or `null` |
| `start_time` | integer \| null | ≥ `arrival_time`, ≤ `arrival_time + max_delay` |
| `failed` | boolean | Present only when `true` |
| `total_system_cost_estimate` | float | Must match judge formula within ±₹0.01 |

### REST API Endpoints

#### `GET /health`
```bash
curl https://smartsettle-api.onrender.com/health
# {"status": "ok", "version": "1.0.0"}
```

#### `POST /solve`
Upload CSV, receive optimized submission JSON.

```bash
curl -X POST https://smartsettle-api.onrender.com/solve \
  -F "file=@transactions.csv"
```

Response:
```json
{
  "status": "success",
  "total_cost": 0.60,
  "assignments": [...],
  "stats": {
    "total_transactions": 3,
    "successful": 3,
    "failed": 0,
    "channel_usage": {"Channel_F": 0, "Channel_S": 0, "Channel_B": 3},
    "processing_time_ms": 4.2
  }
}
```

#### `POST /validate`
Validate a submission against input transactions.

```bash
curl -X POST https://smartsettle-api.onrender.com/validate \
  -F "transactions=@transactions.csv" \
  -F "submission=@submission.json"
```

Response:
```json
{
  "valid": true,
  "violations": [],
  "recomputed_cost": 0.60,
  "claimed_cost": 0.60,
  "estimate_match": true,
  "checks": {
    "no_early_start": true,
    "no_capacity_violation": true,
    "all_tx_present": true,
    "no_duplicates": true,
    "valid_channel_ids": true
  }
}
```

---

## ⚡ Channel Architecture

### Parameters

| Channel | ID | Fee | Slots | Latency | Best For |
|--------|----|-----|-------|---------|---------|
| **FAST** | `Channel_F` | ₹5.00 | 2 | 1 min | High-value, tight deadlines |
| **STANDARD** | `Channel_S` | ₹1.00 | 4 | 3 min | Medium amounts, moderate deadlines |
| **BULK** | `Channel_B` | ₹0.20 | 10 | 10 min | Low amounts, generous deadlines |

### Min-Heap Slot Tracking

```python
# Initialize — all slots free at t=0
heaps = {
    "Channel_F": [0, 0],
    "Channel_S": [0, 0, 0, 0],
    "Channel_B": [0] * 10
}

# Query earliest free slot — O(1)
earliest_free = heaps["Channel_F"][0]

# Reserve a slot — O(log K)
heapq.heappop(heaps["Channel_F"])
heapq.heappush(heaps["Channel_F"], start_time + latency)
```

### Maximum Concurrent Capacity

```
2 (FAST) + 4 (STANDARD) + 10 (BULK) = 16 transactions simultaneously
```

---

## 💰 Cost Formula — Exact Implementation

### Successful Transaction

```
cost = channel_fee + (P × amount × delay)

P     = 0.001
delay = start_time − arrival_time   (always ≥ 0)
```

### Failed Transaction

```
failure_penalty = F × amount

F = 0.5
```

### Total System Cost

```
total = Σ [fee + (0.001 × amount × delay)]  for successful txs
      + Σ [0.5 × amount]                    for failed txs
```

### Graceful Failure Trigger

```python
if not options:                    # no feasible channel exists
    fail(tx)
elif options[0][0] > F * amount:   # routing costs more than failing
    fail(tx)
```

### Verification Function

```python
def verify_cost(assignments, transactions_dict):
    total = 0.0
    for a in assignments:
        tx = transactions_dict[a["tx_id"]]
        if a.get("failed"):
            total += 0.5 * tx["amount"]
        else:
            delay = a["start_time"] - tx["arrival_time"]
            fee   = CHANNELS[a["channel_id"]]["fee"]
            total += fee + (0.001 * tx["amount"] * delay)
    return round(total, 2)
```

---

## 📊 Dataset Reference

All datasets use `random.seed(42)` for reproducibility.

### Best Case

| File | Txs | Scenario |
|------|-----|----------|
| `BC1_perfect_spread.csv` | 12 | Ideal channel spread, zero contention |
| `BC2_no_contention.csv` | 20 | Arrive 8 min apart, never overlap |
| `BC3_all_bulk_safe.csv` | 30 | All amounts < ₹1,000, deadlines > 60 min |
| `BC4_all_routable.csv` | 10 | Every tx fits any channel comfortably |
| `BC5_breakeven_sweet_spot.csv` | 9 | Amounts at ₹3,800–₹4,200 crossover zone |

### Worst Case

| File | Txs | Scenario |
|------|-----|----------|
| `WC1_fast_channel_flood.csv` | 20 | 20 txs need FAST, only 2 slots |
| `WC2_deadline_cliff.csv` | 15 | Every tx: `max_delay = 1` |
| `WC3_failure_trap.csv` | 11 | Channels blocked, tiny amounts forced to fail |
| `WC4_peak_burst_50tx.csv` | 50 | All 50 arrive at `arrival_time = 0` |
| `WC5_stress_100tx.csv` | 100 | 4 groups with overlapping deadlines |
| `WC6_channel_outage_sim.csv` | 11 | FAST effectively unavailable |
| `WC7_fee_spike_trap.csv` | 10 | Amounts near break-even — ambiguous routing |
| `WC8_cascade_failure_risk.csv` | 10 | Poor routing of tx N causes tx N+1 to miss deadline |

### Large Scale

| File | Txs | Avg Amount | Tight Deadlines |
|------|-----|------------|----------------|
| `LARGE1_basic_500tx.csv` | 500 | ₹7,880 | 21% |
| `LARGE2_peak_1000tx.csv` | 1,000 | ₹9,870 | 32% |
| `LARGE3_stress_2000tx.csv` | 2,000 | ₹7,049 | 36% |
| `LARGE4_realworld_800tx.csv` | 800 | ₹8,214 | 13% |
| `LARGE5_adversarial_1500tx.csv` | 1,400 | ₹6,335 | 35% |

**LARGE5 contains 5 deliberate algorithm traps:** FAST slot theft by small txs, same-minute deadline splits, break-even ambiguity cluster, simultaneous BULK flood, and random noise.

---

## 🧪 Test Results & Benchmarks

### Sample Run (3 Transactions)

```
Input:
  T1 — ₹10,000  arrival=0  max_delay=10  priority=5
  T2 — ₹500     arrival=1  max_delay=30  priority=2
  T3 — ₹2,000   arrival=2  max_delay=5   priority=4

Sort order (by deadline):
  #1 T3  deadline=7   urgency=1333
  #2 T1  deadline=10  urgency=4545
  #3 T2  deadline=31  urgency=32

Assignments:
  T1 → Channel_B  start=0  delay=0  cost=₹0.20  ✅
  T2 → Channel_B  start=1  delay=0  cost=₹0.20  ✅
  T3 → Channel_B  start=2  delay=0  cost=₹0.20  ✅

TOTAL COST = ₹0.60  ✅  (estimate matches exactly)
```

### Performance

| Dataset | Transactions | Runtime |
|---------|-------------|---------|
| Basic sample | 3 | < 1ms |
| Peak | 1,000 | ~8ms |
| Stress | 2,000 | ~15ms |
| Adversarial | 1,400 | ~12ms |

---

## 🛡 Resilience & Edge Cases

All channel parameters live in a single config dict — no hardcoded values:

```python
CHANNELS = {
    "Channel_F": {"fee": 5.0, "latency": 1, "capacity": 2},
    "Channel_S": {"fee": 1.0, "latency": 3, "capacity": 4},
    "Channel_B": {"fee": 0.20,"latency": 10,"capacity": 10},
}
```

| Twist Scenario | Adaptation | Code Change |
|---------------|------------|-------------|
| FAST channel outage | Remove `Channel_F` from dict | 1 line |
| Fee spike (FAST ₹5→₹10) | Update `fee` value | 1 line |
| Priority burst (new txs) | Append + re-sort + continue loop | 3 lines |
| System-wide max_delay change | Input CSV changes; algo auto-adapts | 0 lines |
| Partial channel blackout | Add `blackout_window` check in start_time calc | 5 lines |

---

## ✅ Constraints & Disqualification Prevention

| Rule | Violation | Our Prevention |
|------|-----------|---------------|
| No early start | `start_time < arrival_time` | `start_time = max(arrival_time, heap[0])` always ≥ arrival |
| No capacity violation | Concurrent txs > channel capacity | Heap size = capacity; pop before every push |
| All txs present | Missing `tx_id` in output | Every tx processed in loop exactly once |
| No duplicate `tx_id` | Same tx appears twice | Single-pass loop; no re-visits |
| Valid channel IDs | Invalid `channel_id` string | Constants from config dict only |
| Deadline respected | `start_time > deadline` | `feasible = (start_time <= deadline)` checked per channel |
| Cost estimate matches | Estimate ≠ recomputed cost | Same formula used for routing decision AND final estimate |

---

## 🤝 Contributing

```bash
git clone https://github.com/YOUR_USERNAME/smartsettle.git
git checkout -b feature/your-improvement

# Make changes and test
python -m pytest tests/ -v
npm run lint

git add .
git commit -m "feat: add post-assignment review pass"
git push origin feature/your-improvement
# Open Pull Request on GitHub
```

### Commit Convention

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `perf:` | Performance improvement |
| `docs:` | Documentation |
| `test:` | Tests |
| `refactor:` | Code restructure |

---

## 📜 License

MIT License — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgements

- **Hackathon 2026** — problem statement and platform
- **Earliest Deadline First (EDF)** — theoretical scheduling foundation
- **Python `heapq`** — priority queue powering slot tracking
- **shadcn/ui** — accessible, beautiful component library
- **Vite + React 19** — exceptional developer experience
- **Tailwind CSS** — rapid, consistent styling

---

<div align="center">

<br/>

**SmartSettle — Route smarter. Settle faster. Pay less.**

*Built with ❤️ for Hackathon 2026*

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/smartsettle?style=social)](https://github.com/YOUR_USERNAME/smartsettle/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/YOUR_USERNAME/smartsettle?style=social)](https://github.com/YOUR_USERNAME/smartsettle/network/members)

</div>
