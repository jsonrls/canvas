# Qollab Concurrent Capacity Test Prompt

**Product:** Qollab (BoardPrep Canvas)  
**Purpose:** Comprehensive concurrent-user capacity test to determine how many users can use the website at the same time  
**Document type:** Executable test prompt + capacity report template  
**Generated from codebase:** Next.js 16 + Supabase + authenticated Yjs WebSocket service + OpenAI study tools  
**Date:** 2026-07-28

---

## How to use this document

1. Copy **Section A — Master Agent Prompt** into a load-testing agent, QA engineer brief, or automation runner.
2. Point the agent at the target environment (`BASE_URL`, `YJS_WS_URL`, credentials).
3. Execute the phased ramp in **Section C**.
4. Fill **Section G — Capacity Report** with measured results.
5. Export or keep this file as the official `.md` capacity report.

---

## Section A — Master Agent Prompt

```text
You are a senior performance and reliability engineer. Your job is to determine
how many concurrent users Qollab can support at the same time under realistic
study-room workloads.

Product under test: Qollab
- Authenticated collaborative study workspace
- Stack: Next.js (App Router), Supabase Auth + Postgres + Storage, Yjs WebSocket
  collaboration server, TipTap notes, React-PDF annotations, SVG whiteboard,
  OpenAI-backed AI study pack + whiteboard answer routes

Primary question to answer:
"What is the maximum number of concurrent users Qollab can sustain while remaining
usable, correct, and stable?"

You must perform a comprehensive capacity test — not a single spike. Cover:
1. Auth and session establishment
2. Room directory and room open
3. Real-time collaboration (notes / PDF / whiteboard)
4. Presence / presentation channels
5. API and server actions under load
6. AI endpoints under controlled load
7. Mixed multi-room vs single-room contention
8. Failure modes, recovery, and graceful degradation

============================================================
ENVIRONMENT INPUTS (fill before run)
============================================================
- BASE_URL: _______________________________  (e.g. https://staging.example.com or http://localhost:3000)
- YJS_WS_URL: _____________________________  (e.g. wss://… or ws://localhost:1234)
- SUPABASE project: _______________________
- Test account pool size: _________________  (recommended ≥ 100 disposable users)
- Target rooms: ___________________________  (at least 1 shared room + N private rooms)
- Duration budget: ________________________  (recommended 45–90 minutes)
- Safety mode: dry-run | staging | production-read-only mixed load
- AI load mode: off | low | full  (default: low; AI is expensive and rate-limited)

Hard rules:
- Never use production user data or real student content.
- Prefer disposable confirmed Supabase users.
- Cap AI generation load unless explicitly authorized.
- Stop a phase immediately if error rate > 5% sustained for 60s, or p95 latency
  exceeds the hard SLOs below for 2 consecutive steps.
- Clean up temporary rooms, versions, PDFs, and saved guides after the run.
- Do not force-push, delete production data, or expose service-role keys.

============================================================
ARCHITECTURE AWARENESS (from codebase — test these surfaces)
============================================================

HTTP / App surfaces
- GET  /login
- GET  /rooms                         (auth required; directory)
- GET  /rooms/[roomId]                (auth + membership; loads workspace snapshot)
- GET  /rooms/[roomId]/settings
- GET  /api/auth/access-token         (short-lived token for Yjs)
- GET|POST|PUT  /api/rooms/[roomId]/pdf
- POST /api/rooms/[roomId]/ai-study-pack
- GET|POST|DELETE /api/rooms/[roomId]/saved-study-guides
- POST /api/rooms/[roomId]/whiteboard-answer
- Server actions: createRoom, joinRoom, leave, settings, version save/restore

Realtime surfaces (critical capacity bottleneck)
- Yjs document WS:  {YJS_WS_URL}/{documentName}?access_token=…
  - notes document name: roomSlug
  - pdf document name: roomSlug--pdf
  - whiteboard document name: roomSlug--whiteboard
- Presence WS: {YJS_WS_URL}/presence/{roomSlug}?access_token=…
- Health: GET {YJS_WS_URL origin}/health → {"status":"ok"}
- Auth on upgrade: Supabase getUser(token) + room membership check
- Viewers: read-only WS path (sync step one only)
- Editors/owners: full writable CRDT path
- Persistence: full Yjs state blob rewrite to Supabase ~750ms after updates
- Known risk: full-state rewrite under high write churn; large docs amplify cost

Hard product limits already in code (do not treat as bugs unless broken)
- AI study pack: 5 attempts / user / room / 10 minutes (in-memory, instance-local)
- AI study pack provider timeout: 55s; route maxDuration 60s
- Whiteboard answer timeout: 25s
- PDF max size: 15 MiB; one active PDF per room
- Whiteboard image max: 1 MiB
- Saved study guides: max 50 per user per room
- Version content max: 2 MiB content / 24 MiB yjs base64

============================================================
USER PERSONAS (virtual users)
============================================================
Create a mix that mirrors real study groups:

P1 Lurker Viewer (25%)
- Login, open room, remain connected as viewer
- Read notes/PDF snapshot; no edits
- Keep presence/awareness alive

P2 Active Note Editor (30%)
- Login, open shared room as editor
- Fetch access token, open notes WS
- Type continuously (bursts of 5–40 chars every 1–3s)
- Occasional version save (1 per 5 min)

P3 PDF Annotator (15%)
- Open PDF tool channel (roomSlug--pdf)
- Add highlights/sticky notes at moderate rate
- Zoom/page navigation

P4 Whiteboard Collaborator (15%)
- Open whiteboard channel (roomSlug--whiteboard)
- Draw strokes, shapes, text; occasional laser pointer awareness
- Optional low-rate whiteboard-answer calls (only if AI mode allows)

P5 Room Manager / Dashboard Hopper (10%)
- Create/join/leave rooms
- Refresh /rooms directory
- Open settings, change visibility, add member by email (staging only)

P6 AI Power User (5%) — only when AI mode = low|full
- Generate study pack from note snapshot
- Save/list/delete study guides within limits
- Respect 5/10min quota; measure 429 behavior intentionally

============================================================
SUCCESS / FAILURE SLOs (declare pass/fail per concurrency step)
============================================================
Usability SLOs (must hold for a step to count as “supported”)
- Login success rate ≥ 99%
- Room page TTFB p95 ≤ 2.5s (warm), ≤ 5s (cold)
- /api/auth/access-token p95 ≤ 500ms
- Yjs WS upgrade success ≥ 99%
- Time-to-synced (WS open → first usable sync) p95 ≤ 3s
- Collaborative edit visibility to peers p95 ≤ 1.5s
- HTTP API non-AI error rate ≤ 1%
- AI endpoints (when enabled): success or expected 429 ≥ 95%; unexpected 5xx ≤ 2%
- No process crash of Next.js or Yjs server
- No sustained memory growth > 30% over 10 min at steady load without recovery
- Yjs /health remains 200 throughout

Hard stop conditions
- Error rate > 5% for 60s continuous
- Yjs connection failure rate > 10%
- Median edit propagation > 5s
- OOM, unhandled rejections, or restart loops
- Supabase rate-limit storms or auth outages
- Data loss / document corruption observed between clients

============================================================
TEST PLAN — EXECUTE IN ORDER
============================================================

PHASE 0 — Baseline & instrumentation (5–10 min)
1. Confirm BASE_URL and YJS health.
2. Confirm one happy-path manual session: login → rooms → open room → edit note → see peer.
3. Capture idle resource baselines:
   - Next.js CPU/RSS
   - Yjs server CPU/RSS, open sockets, docs in memory
   - Supabase dashboard: auth requests, DB CPU, storage, connection count if available
4. Create disposable users and seed memberships:
   - Shared mega-room A (many members)
   - Shared room B (medium)
   - N private single-user rooms for isolation tests
5. Record software versions, region, instance sizes, env (dev/staging/prod-like).

PHASE 1 — Smoke concurrency (2, 5, 10 users)
- Mix: mostly P1+P2 in one room
- Hold 3 minutes each step
- Validate correctness: text converges via Yjs; no duplicate ownership bugs
- Record metrics template rows

PHASE 2 — Single-room hot-document contention
Ramp concurrent editors in ONE notes document:
  10 → 25 → 50 → 75 → 100 (or until hard stop)
- All users on same roomSlug notes channel
- Continuous typing + awareness updates
- Measure:
  - WS connect success
  - sync latency
  - peer visibility latency
  - persist lag / Supabase write errors
  - Yjs CPU/memory
- Also test same ramp on whiteboard and PDF channels separately (lighter write rate)

PHASE 3 — Multi-room horizontal scale
Spread users across many rooms (1–3 users per room):
  25 → 50 → 100 → 150 → 200 → 300 (or until hard stop)
- Goal: find platform-wide concurrency (Next + Supabase + Yjs doc count)
- Each room opens notes WS; 20% also open presence
- Measure docs loaded in Yjs memory, auth token endpoint throughput, room page latency

PHASE 4 — Mixed realistic workload (the headline number)
Use persona mix above at total concurrent users:
  25 → 50 → 75 → 100 → 150 → 200 → 250 → 300+
- Hold each step 5 minutes steady-state after ramp
- Include:
  - directory refreshes
  - room switches
  - version saves at low rate
  - PDF signed URL fetches
  - presence presentation start/stop by 1 presenter per room
- AI mode:
  - off: skip AI
  - low: ≤ 1 AI study-pack request / 30s globally
  - full: intentional quota probing only in staging

PHASE 5 — Spike & soak
1. Spike: jump from steady N to 2N for 2 minutes, then back to N
2. Soak: hold max-passing N for 20–30 minutes
3. Observe memory leaks, WS reconnect storms, persist timer backlog, auth refresh

PHASE 6 — Degraded / edge concurrency
1. Viewers-only flood (read-only WS) vs editors
2. Reconnect storm: drop 50% sockets, force re-auth via /api/auth/access-token
3. Offline-to-online merge: subset of editors offline 30s then reconnect (CRDT merge)
4. Unauthorized WS attempts (expect 401/403; ensure no resource exhaustion)
5. Large document stress: pre-seed a large notes yjs_state; open with 25 clients
6. PDF upload contention: serial owner uploads only (one active PDF rule)

PHASE 7 — Capacity verdict
Determine and report ALL of the following numbers:
1. Max concurrent users (mixed realistic) — primary KPI
2. Max concurrent editors on one notes document
3. Max concurrent rooms with ≥1 live WS each
4. Max concurrent viewers (read-only)
5. Safe operating capacity (≈ 70% of max before SLO breach)
6. First bottleneck component (Yjs / Next / Supabase Auth / DB / Storage / OpenAI / client)
7. Recommended production limits (per room and global)

============================================================
METRICS TO CAPTURE EVERY STEP
============================================================
Concurrency step metadata
- target_users, actual_users, persona_mix, rooms_active, duration_s

Client / synthetic metrics
- login_success_rate, login_p50/p95
- room_open_p50/p95
- access_token_p50/p95/error_rate
- ws_upgrade_success_rate, ws_time_to_synced_p50/p95
- edit_propagation_p50/p95
- http_error_rate_by_route
- ai_success_rate, ai_429_rate, ai_p95 (if enabled)

Server metrics
- next_cpu%, next_rss_mb, next_event_loop_lag_ms
- yjs_cpu%, yjs_rss_mb, yjs_open_sockets, yjs_docs_in_memory
- yjs_persist_failures, yjs_auth_reject_rate
- supabase_auth_rps, db_cpu, storage_errors

Correctness checks (sample every step)
- Final shared note text converges across 3 sampled clients
- No privilege escalation (viewer cannot write)
- Presence participant counts roughly match connected users
- Version save creates immutable row when exercised
- After soak, reopen room still loads persisted state

============================================================
TOOLING SUGGESTIONS (choose what is available)
============================================================
- k6 or Artillery for HTTP + custom WS scenarios
- Playwright multi-context for true browser realism (smaller N)
- autocannon/hey for simple HTTP ceilings
- ws / y-websocket clients for pure collaboration scale
- Node scripts reusing project verify patterns (disposable users)
- OS monitors: top/htop, `lsof`, process RSS
- Optional: browser DevTools performance on 5 real sessions during peak

If automating, prefer:
1) pure protocol load (token + WS + CRDT updates) for high N
2) browser smoke at peak N/10 for UX confirmation

============================================================
OUTPUT FORMAT (mandatory)
============================================================
After the run, produce a Capacity Report with:

1. Executive summary (max concurrent users + confidence)
2. Environment under test
3. Methodology and persona mix
4. Results table per phase/step
5. Bottleneck analysis with evidence
6. Safe capacity recommendation
7. Risks & known product limits encountered
8. Follow-up hardening recommendations
9. Raw metric appendix

Use the template in Section G of CONCURRENT_CAPACITY_TEST_PROMPT.md.
Fill every field; mark N/A only when a phase was intentionally skipped.
Be honest: if the test was local-dev only, state that production capacity will differ.
```

---

## Section B — System map for testers

```text
Browser clients
  │
  ├─ Next.js app (SSR pages + Route Handlers + Server Actions)
  │    ├─ Supabase Auth session cookies
  │    ├─ /api/auth/access-token
  │    ├─ /api/rooms/:id/pdf | ai-study-pack | saved-study-guides | whiteboard-answer
  │    └─ room server actions (create/join/settings/versions)
  │
  ├─ Yjs WebSocket service (server/yjs-server.mjs)
  │    ├─ Auth on HTTP upgrade (token + membership)
  │    ├─ Document channels: notes | pdf | whiteboard
  │    ├─ Presence channel: /presence/{roomSlug}
  │    └─ Debounced full-state persist → Supabase documents.yjs_state
  │
  └─ Supabase
       ├─ Auth
       ├─ Postgres (rooms, members, documents, versions, profiles, saved guides)
       └─ Storage (private boardprep-pdfs bucket)
```

### Why concurrency is multi-dimensional here

| Dimension | What breaks first (likely) | Why |
|---|---|---|
| Many users, many rooms | Yjs process memory / open sockets; Next SSR | One WS (+ optional tool WS + presence) per active user |
| Many editors, one room | CRDT update fan-out + full-state persist | Every keystroke multiplies updates; persist rewrites whole blob |
| Dashboard thrash | Supabase Auth + RLS queries | `/rooms` and room open hit membership/profile reads |
| AI burst | OpenAI + in-memory rate limit + long requests | 55s timeouts hold serverless/function capacity |
| PDF churn | Storage signed URL + bandwidth | 15 MiB assets; replacement rules |

---

## Section C — Recommended ramp schedule

| Step | Concurrent users | Pattern | Hold | Goal |
|---:|---:|---|---|---|
| 0 | 1–2 | manual | — | correctness baseline |
| 1 | 5 | mixed | 3 min | smoke |
| 2 | 10 | mixed | 3 min | small group |
| 3 | 25 | mixed | 5 min | tutorial-size class |
| 4 | 50 | mixed | 5 min | multi-room study hall |
| 5 | 75 | mixed | 5 min | stress |
| 6 | 100 | mixed | 5 min | target campus cohort |
| 7 | 150 | mixed | 5 min | scale search |
| 8 | 200 | mixed | 5 min | scale search |
| 9 | 300+ | mixed | 5 min | find breaking point |
| Soak | max-pass | mixed | 20–30 min | stability |
| Spike | 2× max-pass | mixed | 2 min | elasticity |

**Single-room editor ladder (separate run):** 5 → 10 → 20 → 30 → 50 → 75 editors on one notes doc.

---

## Section D — Scenario scripts (logical)

### D1. Authenticated session bootstrap

```text
FOR each virtual user:
  1. POST/login via Supabase auth (or pre-mint session cookies)
  2. GET /rooms  expect 200
  3. GET /rooms/{slug} expect 200 workspace
  4. GET /api/auth/access-token expect 200 { accessToken }
```

### D2. Live notes collaboration

```text
FOR each editor in room R:
  1. Obtain accessToken
  2. Connect WS to {YJS_WS_URL}/{roomSlug}?access_token=...
  3. Wait until synced
  4. Apply Yjs updates (simulate typing) every 1–3s
  5. Read awareness states; assert own presence visible
  6. Sample peer documents every 10s; record divergence window
```

### D3. Multi-tool room

```text
30% users notes only
20% notes + presence
15% pdf channel
15% whiteboard channel
10% hop rooms every 60–120s
10% idle viewers
```

### D4. AI controlled probe (optional)

```text
IF ai_mode != off:
  select ≤ GENERATION_LIMIT requests per user/room/10min
  POST /api/rooms/{id}/ai-study-pack with short sourceText
  expect 200 or 429 with Retry-After semantics
  never exceed authorized OpenAI budget
```

### D5. Correctness oracle

```text
At end of each step on shared room:
  - Pick 3 clients
  - Compare exported plain-text notes
  - Accept transient lag < SLO; fail on permanent split brain
  - Re-open room in fresh browser; confirm Supabase-persisted state loads
```

---

## Section E — Pass / fail decision rules

A concurrency level **N** is **SUPPORTED** only if all are true during the hold window:

1. All usability SLOs in Section A hold.
2. No hard-stop condition triggers.
3. Correctness oracle passes.
4. After the step, Yjs `/health` is ok and servers remain responsive to a new single user.

A concurrency level **N** is the **MAXIMUM** if:

- N is SUPPORTED, and
- N+next step is not SUPPORTED, or a hard stop occurs while ramping to the next step.

**Safe operating capacity** = floor(0.7 × MAXIMUM mixed concurrent users).

---

## Section F — Implementation checklist for the runner

- [ ] Disposable user pool provisioned and confirmed
- [ ] Shared + private rooms seeded with memberships
- [ ] BASE_URL and YJS_WS_URL verified
- [ ] Monitoring attached (process + optional Supabase)
- [ ] AI mode selected and budget capped
- [ ] Phase 0 baseline captured
- [ ] Phases 1–7 executed or explicitly skipped with reason
- [ ] Cleanup completed (users/rooms/assets as policy allows)
- [ ] Section G report filled
- [ ] Evidence artifacts saved (CSV/JSON logs, screenshots optional)

---

## Section G — Capacity Report (fill after execution)

### 1. Executive summary

| Field | Value |
|---|---|
| Test date | _TBD_ |
| Environment | _local / staging / production-like_ |
| **Max concurrent users (mixed realistic)** | _TBD_ |
| **Safe operating capacity (70%)** | _TBD_ |
| Max concurrent editors on one notes doc | _TBD_ |
| Max concurrent live rooms | _TBD_ |
| Max concurrent read-only viewers | _TBD_ |
| Primary bottleneck | _TBD_ |
| Confidence | _low / medium / high_ |
| One-sentence verdict | _TBD_ |

### 2. Environment under test

| Component | Detail |
|---|---|
| App URL | |
| Yjs URL | |
| Next.js hosting / instance size | |
| Yjs host / instance size | |
| Supabase plan / region | |
| OpenAI model / enabled? | |
| Node version | |
| Commit SHA / branch | |
| Test tool(s) | |
| Virtual user pool size | |

### 3. Methodology

- Persona mix used:
- Ramp schedule deviations:
- AI mode:
- Think time / pacing:
- Measurement method (protocol vs browser):
- Limitations of this run:

### 4. Results by step

| Step | Users | Rooms | WS success % | Edit p95 (ms) | Room open p95 (ms) | HTTP err % | CPU Next/Yjs | Result |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | 5 | | | | | | | |
| 2 | 10 | | | | | | | |
| 3 | 25 | | | | | | | |
| 4 | 50 | | | | | | | |
| 5 | 75 | | | | | | | |
| 6 | 100 | | | | | | | |
| 7 | 150 | | | | | | | |
| 8 | 200 | | | | | | | |
| Soak | | | | | | | | |
| Spike | | | | | | | | |

### 5. Single-room contention results

| Editors on 1 notes doc | Sync p95 | Propagate p95 | Persist errors | Result |
|---:|---:|---:|---:|---|
| 5 | | | | |
| 10 | | | | |
| 25 | | | | |
| 50 | | | | |
| 75+ | | | | |

### 6. Bottleneck analysis

| Observation | Evidence | Impact |
|---|---|---|
| | | |

Likely candidates to evaluate explicitly:

1. **Yjs server** — socket count, doc memory, full-state persist every ~750ms  
2. **Supabase Auth** — `getUser` on every WS upgrade + access-token route  
3. **Postgres** — membership checks, document blob updates, version inserts  
4. **Next.js** — SSR room pages, server actions, route handlers  
5. **OpenAI** — long-held requests / quotas (if enabled)  
6. **Client devices** — browser CPU with large CRDT docs and awareness  

### 7. Recommendations

| Priority | Recommendation | Rationale |
|---|---|---|
| P0 | | |
| P1 | | |
| P2 | | |

Suggested engineering follow-ups if limits are low:

- Incremental Yjs persistence instead of full blob rewrite  
- Connection tickets instead of long-lived access_token query params  
- Distributed AI rate limits (current limit is instance-local memory)  
- Horizontal Yjs sticky routing by room  
- Cap awareness/laser update frequency  
- CDN/edge caching only for truly public static assets (auth pages remain private)  
- Load-shed: max members per room / max concurrent sockets per user  

### 8. Risks & product limits observed

- AI: 5 generations / user / room / 10 minutes (in-memory)  
- PDF: 15 MiB, one active asset  
- Saved guides: 50 / user / room  
- Viewers are read-only (expected)  
- Other:

### 9. Appendix

- Raw metrics path:
- Logs path:
- Failed request samples:
- Screenshots / traces:
- Cleanup confirmation:

---

## Section H — Quick copy: one-shot short prompt

Use this if you only need a compact instruction:

```text
Run a comprehensive concurrent-user capacity test on Qollab (Next.js + Supabase +
authenticated Yjs at YJS_WS_URL). Determine how many users can use the site at the
same time.

Cover: login, /rooms, /rooms/[slug], /api/auth/access-token, Yjs notes/pdf/whiteboard
sockets, /presence, room server actions, PDF routes, and optional low-rate AI routes.

Ramp mixed personas 5→10→25→50→75→100→150→200→300, plus a single-room editor ladder
and a 20–30 min soak at max-pass. Stop if error rate >5% for 60s or edit propagation
p95 >5s.

Report max concurrent users, safe 70% capacity, per-room editor cap, first bottleneck,
and fill the Capacity Report tables in CONCURRENT_CAPACITY_TEST_PROMPT.md.
```

---

## Section I — Codebase-derived endpoint matrix

| Surface | Auth | Concurrent risk | Notes |
|---|---|---|---|
| `GET /login` | public | low | static-ish |
| `GET /rooms` | session | medium | directory queries per user |
| `GET /rooms/[roomId]` | session + member | high | SSR workspace + versions |
| `GET /api/auth/access-token` | session | high | called on connect/reconnect |
| Yjs `/{roomSlug}` | bearer query token + member | **critical** | notes CRDT |
| Yjs `/{roomSlug}--pdf` | same | high | annotation map |
| Yjs `/{roomSlug}--whiteboard` | same | high | element map + awareness laser |
| Yjs `/presence/{roomSlug}` | same | medium | presentation fan-out |
| `GET/POST/PUT /api/rooms/.../pdf` | session + role | medium | storage + 15 MiB |
| `POST .../ai-study-pack` | session + member | high cost | 5/10min, 55s timeout |
| `POST .../whiteboard-answer` | session + editor | medium cost | 25s timeout |
| `GET/POST/DELETE .../saved-study-guides` | session | low–medium | max 50 |
| Room server actions | session + role | medium | create/join/settings/versions |
| Yjs `GET /health` | public | monitor only | liveness |

---

## Section J — Interpretation guide

| Observed max mixed users | Interpretation for Qollab |
|---:|---|
| < 10 | Local-dev only; not multi-user ready without infra work |
| 10–25 | Small study group viable on current single-node setup |
| 25–50 | Section / tutoring scale on modest staging |
| 50–100 | Cohort-scale; plan Yjs horizontal strategy |
| 100–250 | Strong for early SaaS; harden persist + auth path |
| 250+ | Production-class concurrency for this architecture generation |

Always qualify results with environment size. A number measured on `npm run dev:all` on a laptop is **not** a production SLA.

---

*End of concurrent capacity test prompt. Execute Section A, then complete Section G as the exported capacity report.*
