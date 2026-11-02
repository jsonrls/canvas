import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.CAPACITY_BASE_URL ?? "http://localhost:3000";
const yjsWsUrl =
  process.env.CAPACITY_YJS_WS_URL ??
  process.env.NEXT_PUBLIC_YJS_WS_URL ??
  "ws://localhost:1234";
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mode = process.argv[2] ?? "help";
const scale = Number(process.env.CAPACITY_TIME_SCALE ?? "1");
const poolSize = Number(process.env.CAPACITY_USER_POOL ?? "120");
const roomCount = Number(process.env.CAPACITY_ROOM_COUNT ?? "320");
const artifactsDir = new URL("../capacity-results/", import.meta.url);
const statePath = new URL("test-state.json", artifactsDir);
const rawPath = new URL("raw-metrics.json", artifactsDir);
const summaryPath = new URL("summary.json", artifactsDir);
const runId = `capacity-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(1, milliseconds)));

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
  throw new Error("CAPACITY_TIME_SCALE must be greater than 0 and at most 1.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)
  ];
}

function summarize(values) {
  return {
    count: values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    max: values.length === 0 ? null : Math.max(...values),
  };
}

function round(value, digits = 2) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : value;
}

function chunk(values, size) {
  const groups = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

async function mapLimit(values, limit, operation) {
  const results = new Array(values.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, values.length) },
    async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await operation(values[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function ensureArtifactsDir() {
  await mkdir(artifactsDir, { recursive: true });
}

async function readState() {
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function signInWithCookies(account) {
  const cookies = [];
  const client = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll: () => cookies,
      setAll: (nextCookies) => {
        for (const next of nextCookies) {
          const existing = cookies.findIndex((item) => item.name === next.name);
          if (existing >= 0) cookies.splice(existing, 1);
          if (next.value) cookies.push(next);
        }
      },
    },
  });
  const startedAt = performance.now();
  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  const latencyMs = performance.now() - startedAt;

  if (error || !data.session) {
    return { error: error?.message ?? "missing session", latencyMs };
  }

  return {
    accessToken: data.session.access_token,
    cookieHeader: cookies
      .map(({ name, value }) => `${name}=${value}`)
      .join("; "),
    latencyMs,
  };
}

function createUserClient(accessToken) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function timedFetch(path, cookieHeader, options = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(new URL(path, baseUrl), {
      ...options,
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...options.headers,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
    });
    const latencyMs = performance.now() - startedAt;
    let json = null;
    if (options.readJson) {
      try {
        json = await response.json();
      } catch {
        json = null;
      }
    } else {
      await response.arrayBuffer();
    }
    return { latencyMs, json, status: response.status };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      latencyMs: performance.now() - startedAt,
      status: 0,
    };
  }
}

async function healthCheck() {
  const healthUrl = new URL(yjsWsUrl);
  healthUrl.protocol = healthUrl.protocol === "wss:" ? "https:" : "http:";
  healthUrl.pathname = "/health";
  const result = await timedFetch(healthUrl.href, "", { timeoutMs: 5_000 });
  return { ...result, ok: result.status === 200 };
}

async function processSample() {
  async function findProcess(pattern) {
    try {
      const { stdout: pids } = await execFileAsync("pgrep", ["-f", pattern]);
      const pid = pids.trim().split(/\s+/).at(-1);
      if (!pid) return null;
      const { stdout } = await execFileAsync("ps", [
        "-o",
        "pid=,%cpu=,rss=",
        "-p",
        pid,
      ]);
      const [parsedPid, cpu, rssKb] = stdout.trim().split(/\s+/).map(Number);
      return {
        cpuPct: round(cpu),
        pid: parsedPid,
        rssMb: round(rssKb / 1024),
      };
    } catch {
      return null;
    }
  }

  const [next, yjs] = await Promise.all([
    findProcess("next dev --turbopack"),
    findProcess("server/yjs-server.mjs"),
  ]);
  return { at: new Date().toISOString(), next, yjs };
}

async function prepare() {
  await ensureArtifactsDir();
  try {
    await readState();
    throw new Error(
      "A capacity test state already exists. Run cleanup before preparing again.",
    );
  } catch (error) {
    if (
      error?.code !== "ENOENT" &&
      !String(error.message).includes("already exists")
    ) {
      throw error;
    }
    if (String(error.message).includes("already exists")) throw error;
  }

  const state = {
    createdAt: new Date().toISOString(),
    runId,
    accounts: [],
    rooms: [],
  };
  const timestamp = Date.now();

  console.log(`Preparing ${poolSize} disposable confirmed users...`);
  const labels = Array.from({ length: poolSize }, (_, index) => index);
  const accounts = await mapLimit(labels, 4, async (index) => {
    const email = `qollab-cap-${timestamp}-${index}-${randomUUID().slice(0, 6)}@example.com`;
    const password = `Cap-${randomUUID()}-A1!`;
    const role = index % 4 === 0 ? "viewer" : "editor";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { display_name: `Capacity VU ${index + 1}` },
    });
    if (error || !data.user) {
      throw new Error(
        `Could not create user ${index + 1}: ${error?.message ?? "missing user"}`,
      );
    }
    return { email, id: data.user.id, index, password, role };
  });
  state.accounts = accounts;
  await writeFile(statePath, JSON.stringify(state, null, 2), { mode: 0o600 });

  console.log(`Preparing ${roomCount + 3} isolated/shared rooms...`);
  const roomSpecs = [
    { kind: "shared-a", name: "Capacity Shared Mega Room A", ownerIndex: 1 },
    { kind: "shared-b", name: "Capacity Shared Room B", ownerIndex: 2 },
    { kind: "large-doc", name: "Capacity Large Document", ownerIndex: 3 },
    ...Array.from({ length: roomCount }, (_, index) => ({
      kind: "private",
      name: `Capacity Private ${index + 1}`,
      ownerIndex: index % accounts.length,
    })),
  ].map((room, index) => ({
    ...room,
    id: randomUUID(),
    slug: `cap-${timestamp}-${index}-${randomUUID().slice(0, 8)}`,
  }));

  for (const group of chunk(roomSpecs, 75)) {
    const { error } = await admin.from("rooms").insert(
      group.map((room) => ({
        id: room.id,
        is_public: false,
        name: room.name,
        owner_id: accounts[room.ownerIndex].id,
        slug: room.slug,
      })),
    );
    if (error) throw new Error(`Room seed failed: ${error.message}`);
  }

  const memberships = roomSpecs.map((room) => ({
    role: "owner",
    room_id: room.id,
    user_id: accounts[room.ownerIndex].id,
  }));
  for (const shared of roomSpecs.filter((room) =>
    ["shared-a", "shared-b", "large-doc"].includes(room.kind),
  )) {
    for (const account of accounts) {
      if (account.id === accounts[shared.ownerIndex].id) continue;
      memberships.push({
        role: account.role,
        room_id: shared.id,
        user_id: account.id,
      });
    }
  }
  for (const group of chunk(memberships, 500)) {
    const { error } = await admin.from("room_members").insert(group);
    if (error) throw new Error(`Membership seed failed: ${error.message}`);
  }

  const documents = roomSpecs.flatMap((room) =>
    ["notes", "pdf", "whiteboard"].map((kind) => ({
      id: randomUUID(),
      kind,
      room_id: room.id,
      title: `${room.name} ${kind}`,
      updated_by: accounts[room.ownerIndex].id,
    })),
  );
  for (const group of chunk(documents, 500)) {
    const { error } = await admin.from("documents").insert(group);
    if (error) throw new Error(`Document seed failed: ${error.message}`);
  }

  state.rooms = roomSpecs;
  await writeFile(statePath, JSON.stringify(state, null, 2), { mode: 0o600 });

  const browserAccount = accounts.find((account) => account.role === "editor");
  await writeFile(
    new URL("browser-account.json", artifactsDir),
    JSON.stringify(
      {
        email: browserAccount.email,
        password: browserAccount.password,
        roomSlug: roomSpecs.find((room) => room.kind === "shared-a").slug,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    `Preparation complete: ${accounts.length} users, ${roomSpecs.length} rooms, ${documents.length} documents.`,
  );
}

async function authenticateVu(account, room) {
  const signedIn = await signInWithCookies(account);
  if (!signedIn.accessToken) {
    return { account, login: signedIn, room };
  }

  const rooms = await timedFetch("/rooms", signedIn.cookieHeader);
  const roomOpen = await timedFetch(
    `/rooms/${encodeURIComponent(room.slug)}`,
    signedIn.cookieHeader,
  );
  const accessToken = await timedFetch(
    "/api/auth/access-token",
    signedIn.cookieHeader,
    { readJson: true },
  );

  return {
    accessToken:
      accessToken.status === 200 &&
      typeof accessToken.json?.accessToken === "string"
        ? accessToken.json.accessToken
        : signedIn.accessToken,
    account,
    cookieHeader: signedIn.cookieHeader,
    http: { accessToken, roomOpen, rooms },
    login: signedIn,
    room,
  };
}

function documentName(roomSlug, kind) {
  if (kind === "notes") return roomSlug;
  return `${roomSlug}--${kind}`;
}

async function connectClient(vu, kind, timeoutMs = 12_000) {
  const doc = new Y.Doc();
  const name = documentName(vu.room.slug, kind);
  const provider = new WebsocketProvider(yjsWsUrl, name, doc, {
    WebSocketPolyfill: WebSocket,
    disableBc: true,
    maxBackoffTime: 1_000,
    params: { access_token: vu.accessToken },
  });
  const startedAt = performance.now();

  const outcome = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(
      () => finish({ error: "sync timeout", synced: false }),
      timeoutMs,
    );
    provider.on("sync", (synced) => {
      if (synced) {
        finish({ syncMs: performance.now() - startedAt, synced: true });
      }
    });
    provider.on("connection-error", () => {
      if (performance.now() - startedAt > timeoutMs / 2) {
        finish({ error: "connection error", synced: false });
      }
    });
  });

  if (!outcome.synced) {
    provider.destroy();
    doc.destroy();
  }
  return { ...outcome, doc, name, provider, vu };
}

function startClientActivity(client, kind, rateMs, propagationSamples) {
  const timers = [];
  const accountIndex = client.vu.account.index;
  const editable = client.vu.account.role !== "viewer";
  let updateCounter = 0;

  if (editable) {
    timers.push(
      setInterval(() => {
        updateCounter += 1;
        if (kind === "notes") {
          const text = client.doc.getText("notes");
          text.insert(text.length, ` ${accountIndex}:${updateCounter}`);
        } else {
          client.doc
            .getMap(kind === "pdf" ? "annotations" : "elements")
            .set(`${accountIndex}:${updateCounter}`, {
              at: Date.now(),
              user: accountIndex,
            });
        }
      }, rateMs),
    );
  }

  timers.push(
    setInterval(() => {
      client.provider.awareness.setLocalStateField("capacity", {
        at: Date.now(),
        user: accountIndex,
      });
    }, 5_000),
  );

  const probes = client.doc.getMap("capacity-probes");
  const observer = (event) => {
    for (const key of event.keysChanged) {
      const value = probes.get(key);
      if (value?.at && value.writer !== accountIndex) {
        propagationSamples.push(Date.now() - value.at);
      }
    }
  };
  probes.observe(observer);

  return {
    stop: () => {
      timers.forEach(clearInterval);
      probes.unobserve(observer);
    },
    writeProbe: () => {
      if (editable) {
        probes.set(`${accountIndex}-${randomUUID().slice(0, 8)}`, {
          at: Date.now(),
          writer: accountIndex,
        });
      }
    },
  };
}

function supportedBySlos(metric) {
  const editApplicable =
    !metric.readOnlyStep && metric.roomsActive < metric.actualUsers;
  const checks = {
    accessTokenP95: (metric.accessToken.p95 ?? Infinity) <= 500,
    editP95:
      !editApplicable || (metric.editPropagation.p95 ?? Infinity) <= 1_500,
    httpErrorRate: metric.httpErrorRate <= 0.01,
    loginSuccess: metric.loginSuccessRate >= 0.99,
    roomOpenP95: (metric.roomOpen.p95 ?? Infinity) <= 2_500,
    wsSuccess: metric.wsSuccessRate >= 0.99,
    wsSyncP95: (metric.wsTimeToSynced.p95 ?? Infinity) <= 3_000,
  };
  return { checks, supported: Object.values(checks).every(Boolean) };
}

async function runStep({
  kind = "notes",
  label,
  phase,
  rooms,
  users,
  holdSeconds,
  viewerOnly = false,
}) {
  const state = await readState();
  const accounts = viewerOnly
    ? state.accounts.filter((account) => account.role === "viewer")
    : kind === "notes" && phase === "phase-2"
      ? state.accounts.filter((account) => account.role === "editor")
      : state.accounts;
  const vus = Array.from({ length: users }, (_, index) => {
    const room = rooms[index % rooms.length];
    const privateOwner =
      room.kind === "private"
        ? state.accounts.find(
            (account) => account.id === state.accounts[room.ownerIndex]?.id,
          )
        : null;
    return {
      account: privateOwner
        ? { ...privateOwner, role: "editor" }
        : accounts[index % accounts.length],
      room,
    };
  });
  console.log(
    `[${phase}] ${label}: authenticating ${users} VUs across ${rooms.length} room(s)...`,
  );

  const resourceSamples = [await processSample()];
  const healthBefore = await healthCheck();
  const authenticated = await mapLimit(vus, 20, ({ account, room }) =>
    authenticateVu(account, room),
  );
  const loginSuccess = authenticated.filter((vu) => vu.accessToken);
  const connected = await mapLimit(loginSuccess, 30, (vu) =>
    connectClient(vu, kind),
  );
  const synced = connected.filter((client) => client.synced);
  const propagationSamples = [];
  const activity = synced.map((client, index) =>
    startClientActivity(
      client,
      kind,
      1_500 + ((index * 137) % 1_500),
      index < 3 ? propagationSamples : [],
    ),
  );
  activity.forEach((item) => {
    item.writeProbe();
  });
  let healthFailures = 0;
  let periodicHttpFailures = 0;
  let periodicHttpTotal = 0;
  const startedAt = Date.now();
  const holdMs = holdSeconds * 1_000 * scale;
  let lastProbeAt = 0;
  let lastHttpAt = 0;
  let lastResourceAt = 0;

  while (Date.now() - startedAt < holdMs) {
    const elapsed = Date.now() - startedAt;
    if (elapsed - lastProbeAt >= Math.max(5_000 * scale, 1_000)) {
      lastProbeAt = elapsed;
      activity.forEach((item) => item.writeProbe());
    }
    if (elapsed - lastHttpAt >= Math.max(30_000 * scale, 4_000)) {
      lastHttpAt = elapsed;
      const sample = authenticated.filter((_, index) => index % 10 === 0);
      const outcomes = await mapLimit(sample, 10, (vu) =>
        timedFetch("/rooms", vu.cookieHeader),
      );
      periodicHttpTotal += outcomes.length;
      periodicHttpFailures += outcomes.filter(
        (result) => result.status < 200 || result.status >= 400,
      ).length;
      const health = await healthCheck();
      if (!health.ok) healthFailures += 1;
    }
    if (elapsed - lastResourceAt >= Math.max(2_000 * scale, 1_000)) {
      lastResourceAt = elapsed;
      resourceSamples.push(await processSample());
    }
    await delay(Math.min(500, Math.max(50, 250 * scale)));
  }

  activity.forEach((item) => item.stop());
  await delay(Math.max(1_000 * scale, 300));

  const correctnessByDocument = new Map();
  for (const client of synced) {
    const samples = correctnessByDocument.get(client.name) ?? [];
    if (samples.length >= 3) continue;
    if (kind === "notes") {
      samples.push(client.doc.getText("notes").toString());
    } else {
      const value = client.doc.getMap(
        kind === "pdf" ? "annotations" : "elements",
      );
      samples.push(JSON.stringify([...value.entries()].toSorted()));
    }
    correctnessByDocument.set(client.name, samples);
  }
  const correctnessSamples = [...correctnessByDocument.values()].flat();
  const converged = [...correctnessByDocument.values()].every(
    (samples) => new Set(samples).size <= 1,
  );

  synced.forEach((client) => {
    client.provider.destroy();
    client.doc.destroy();
  });
  const healthAfter = await healthCheck();
  const loginLatencies = authenticated.map((vu) => vu.login.latencyMs);
  const roomOpen = authenticated.map((vu) => vu.http?.roomOpen).filter(Boolean);
  const accessTokens = authenticated
    .map((vu) => vu.http?.accessToken)
    .filter(Boolean);
  const httpResults = authenticated.flatMap((vu) =>
    vu.http ? Object.values(vu.http) : [],
  );
  const httpErrors =
    httpResults.filter((result) => result.status < 200 || result.status >= 400)
      .length + periodicHttpFailures;
  const httpTotal = httpResults.length + periodicHttpTotal;

  const metric = {
    actualUsers: authenticated.length,
    accessToken: summarize(accessTokens.map((result) => result.latencyMs)),
    concurrency: users,
    correctness: {
      converged,
      sampleCount: correctnessSamples.length,
    },
    durationSeconds: round(holdMs / 1_000),
    editPropagation: summarize(propagationSamples),
    endedAt: new Date().toISOString(),
    health: {
      after: healthAfter.ok,
      before: healthBefore.ok,
      failuresDuringHold: healthFailures,
    },
    httpErrorRate: httpTotal === 0 ? 1 : httpErrors / httpTotal,
    httpRequests: httpTotal,
    kind,
    label,
    login: summarize(loginLatencies),
    loginSuccessRate: users === 0 ? 0 : loginSuccess.length / users,
    phase,
    readOnlyStep: viewerOnly,
    resourceSamples,
    roomOpen: summarize(roomOpen.map((result) => result.latencyMs)),
    roomsActive: new Set(authenticated.map((vu) => vu.room.slug)).size,
    startedAt: new Date(startedAt).toISOString(),
    wsSuccessRate:
      loginSuccess.length === 0 ? 0 : synced.length / loginSuccess.length,
    wsTimeToSynced: summarize(
      connected
        .filter((client) => client.synced)
        .map((client) => client.syncMs),
    ),
  };
  const verdict = supportedBySlos(metric);
  metric.sloChecks = verdict.checks;
  metric.supported = verdict.supported && converged && healthAfter.ok;
  console.log(
    `[${phase}] ${label}: ${metric.supported ? "SUPPORTED" : "FAILED"}; WS ${round(
      metric.wsSuccessRate * 100,
    )}%, edit p95 ${round(metric.editPropagation.p95)}ms, room p95 ${round(
      metric.roomOpen.p95,
    )}ms, HTTP errors ${round(metric.httpErrorRate * 100)}%.`,
  );
  return metric;
}

async function runUnauthorized(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const attempts = 50;
  const outcomes = await Promise.all(
    Array.from(
      { length: attempts },
      () =>
        new Promise((resolve) => {
          const startedAt = performance.now();
          const ws = new WebSocket(
            `${yjsWsUrl}/${room.slug}?access_token=invalid-capacity-token`,
          );
          const timer = setTimeout(() => {
            ws.terminate();
            resolve({
              rejected: false,
              latencyMs: performance.now() - startedAt,
            });
          }, 8_000);
          ws.once("open", () => {
            clearTimeout(timer);
            ws.close();
            resolve({
              rejected: false,
              latencyMs: performance.now() - startedAt,
            });
          });
          ws.once("error", () => {
            clearTimeout(timer);
            resolve({
              rejected: true,
              latencyMs: performance.now() - startedAt,
            });
          });
        }),
    ),
  );
  return {
    attempts,
    healthAfter: (await healthCheck()).ok,
    label: "unauthorized-ws",
    latency: summarize(outcomes.map((outcome) => outcome.latencyMs)),
    phase: "phase-6",
    rejectionRate:
      outcomes.filter((outcome) => outcome.rejected).length / attempts,
    supported: outcomes.every((outcome) => outcome.rejected),
  };
}

async function runOfflineMerge(state) {
  const room = state.rooms.find((item) => item.kind === "shared-b");
  const accounts = state.accounts
    .filter((item) => item.role === "editor")
    .slice(0, 2);
  const authenticated = await Promise.all(
    accounts.map((account) => authenticateVu(account, room)),
  );
  const clients = await Promise.all(
    authenticated.map((vu) => connectClient(vu, "notes")),
  );
  if (!clients.every((client) => client.synced)) {
    clients.forEach((client) => client.provider?.destroy());
    return { label: "offline-merge", phase: "phase-6", supported: false };
  }
  clients[1].provider.disconnect();
  clients[0].doc.getText("offline-merge").insert(0, "online");
  clients[1].doc.getText("offline-merge").insert(0, "offline");
  await delay(Math.max(30_000 * scale, 1_000));
  clients[1].provider.connect();
  const deadline = Date.now() + 12_000;
  while (
    Date.now() < deadline &&
    clients[0].doc.getText("offline-merge").toString() !==
      clients[1].doc.getText("offline-merge").toString()
  ) {
    await delay(100);
  }
  const values = clients.map((client) =>
    client.doc.getText("offline-merge").toString(),
  );
  clients.forEach((client) => {
    client.provider.destroy();
    client.doc.destroy();
  });
  return {
    label: "offline-merge",
    mergedValue: values[0],
    phase: "phase-6",
    supported:
      values[0] === values[1] &&
      values[0].includes("online") &&
      values[0].includes("offline"),
  };
}

async function runViewerWriteProtection(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const viewer = state.accounts.find((item) => item.role === "viewer");
  const editor = state.accounts.find((item) => item.role === "editor");
  const [viewerVu, editorVu] = await Promise.all([
    authenticateVu(viewer, room),
    authenticateVu(editor, room),
  ]);
  const [viewerClient, editorClient] = await Promise.all([
    connectClient(viewerVu, "notes"),
    connectClient(editorVu, "notes"),
  ]);
  const marker = `viewer-forbidden-${randomUUID()}`;
  viewerClient.doc.getMap("viewer-test").set(marker, true);
  await delay(Math.max(2_000 * scale, 1_000));
  const blocked = editorClient.doc.getMap("viewer-test").get(marker) !== true;
  for (const client of [viewerClient, editorClient]) {
    client.provider.destroy();
    client.doc.destroy();
  }
  return {
    blocked,
    label: "viewer-write-protection",
    phase: "phase-6",
    supported: blocked,
  };
}

async function preseedLargeDocument(state) {
  const room = state.rooms.find((item) => item.kind === "large-doc");
  const doc = new Y.Doc();
  doc.getText("notes").insert(0, "L".repeat(1_500_000));
  const encoded = Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64");
  doc.destroy();
  const { error } = await admin
    .from("documents")
    .update({
      yjs_state: encoded,
      yjs_state_updated_at: new Date().toISOString(),
    })
    .eq("room_id", room.id)
    .eq("kind", "notes");
  if (error) throw new Error(`Large document seed failed: ${error.message}`);
  return room;
}

async function runPdfRouteProbe(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const account = state.accounts.find((item) => item.role === "editor");
  const vu = await authenticateVu(account, room);
  const results = [];
  for (let index = 0; index < 3; index += 1) {
    results.push(
      await timedFetch(`/api/rooms/${room.slug}/pdf`, vu.cookieHeader, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        readJson: true,
        body: JSON.stringify({
          fileName: `capacity-${index}.pdf`,
          mimeType: "application/pdf",
          size: 1_024,
        }),
      }),
    );
  }
  return {
    label: "serial-pdf-upload-init",
    latency: summarize(results.map((result) => result.latencyMs)),
    phase: "phase-6",
    statuses: results.map((result) => result.status),
    supported: results.every((result) => result.status === 200),
  };
}

async function runPresenceProbe(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const vus = await mapLimit(state.accounts.slice(0, 25), 20, (account) =>
    authenticateVu(account, room),
  );
  const admitted = vus.filter((vu) => vu.accessToken);
  const sockets = [];
  const latencies = [];
  let presentationMessages = 0;

  await Promise.all(
    admitted.map(
      (vu) =>
        new Promise((resolve) => {
          const startedAt = performance.now();
          const socket = new WebSocket(
            `${yjsWsUrl}/presence/${room.slug}?access_token=${encodeURIComponent(vu.accessToken)}`,
          );
          const timer = setTimeout(() => {
            socket.terminate();
            resolve();
          }, 8_000);
          socket.once("message", () => {
            clearTimeout(timer);
            sockets.push({ socket, vu });
            latencies.push(performance.now() - startedAt);
            resolve();
          });
        }),
    ),
  );
  for (const { socket } of sockets) {
    socket.on("message", (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === "presentation" && payload.presentation) {
          presentationMessages += 1;
        }
      } catch {
        // Ignore non-JSON messages in this protocol check.
      }
    });
  }
  const presenter = sockets.find(({ vu }) => vu.account.role === "editor");
  presenter?.socket.send(
    JSON.stringify({
      presenterName: "Capacity presenter",
      scrollY: 0.5,
      type: "presentation-update",
      workspace: "notes",
    }),
  );
  await delay(750);
  presenter?.socket.send(JSON.stringify({ type: "presentation-stop" }));
  sockets.forEach(({ socket }) => socket.close());
  return {
    connected: sockets.length,
    connectSuccessRate:
      admitted.length === 0 ? 0 : sockets.length / admitted.length,
    label: "presence-presentation-25",
    latency: summarize(latencies),
    phase: "phase-6",
    presentationMessages,
    supported:
      admitted.length === 25 &&
      sockets.length === 25 &&
      presentationMessages >= 24,
    target: 25,
  };
}

async function runReconnectStorm(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const vus = await mapLimit(state.accounts.slice(0, 25), 20, (account) =>
    authenticateVu(account, room),
  );
  const admitted = vus.filter((vu) => vu.accessToken);
  const clients = await mapLimit(admitted, 25, (vu) =>
    connectClient(vu, "notes"),
  );
  const synced = clients.filter((client) => client.synced);
  const reconnecting = synced.filter((_, index) => index % 2 === 0);
  reconnecting.forEach((client) => client.provider.disconnect());
  const tokenRefresh = await mapLimit(reconnecting, 10, (client) =>
    timedFetch("/api/auth/access-token", client.vu.cookieHeader, {
      readJson: true,
    }),
  );
  const startedAt = performance.now();
  reconnecting.forEach((client) => client.provider.connect());
  const deadline = Date.now() + 12_000;
  while (
    Date.now() < deadline &&
    reconnecting.some((client) => !client.provider.synced)
  ) {
    await delay(100);
  }
  const reconnected = reconnecting.filter(
    (client) => client.provider.synced,
  ).length;
  const reconnectMs = performance.now() - startedAt;
  synced.forEach((client) => {
    client.provider.destroy();
    client.doc.destroy();
  });
  return {
    initialSynced: synced.length,
    label: "reconnect-storm-50pct",
    phase: "phase-6",
    reconnected,
    reconnectMs,
    supported:
      admitted.length === 25 &&
      synced.length === 25 &&
      reconnected === reconnecting.length &&
      tokenRefresh.every((result) => result.status === 200),
    target: 25,
    tokenRefresh: summarize(tokenRefresh.map((result) => result.latencyMs)),
  };
}

async function runHttpAndVersionProbe(state) {
  const room = state.rooms.find((item) => item.kind === "shared-a");
  const account = state.accounts.find((item) => item.role === "editor");
  const vu = await authenticateVu(account, room);
  const routes = [
    `/rooms/${room.slug}/settings`,
    `/api/rooms/${room.slug}/pdf`,
    `/api/rooms/${room.slug}/saved-study-guides`,
  ];
  const routeResults = await Promise.all(
    routes.map((path) => timedFetch(path, vu.cookieHeader)),
  );
  const client = createUserClient(vu.accessToken);
  const { data: document, error: documentError } = await client
    .from("documents")
    .select("id")
    .eq("room_id", room.id)
    .eq("kind", "notes")
    .single();
  if (documentError || !document) {
    throw new Error("Supplemental version probe could not find notes.");
  }
  const versionDoc = new Y.Doc();
  versionDoc.getText("notes").insert(0, "Capacity immutable version");
  const yjsState = Buffer.from(Y.encodeStateAsUpdate(versionDoc)).toString(
    "base64",
  );
  versionDoc.destroy();
  const { data: version, error: versionError } = await client
    .from("document_versions")
    .insert({
      content: { type: "doc", content: [] },
      created_by: account.id,
      document_id: document.id,
      label: "Capacity supplemental version",
      yjs_state: yjsState,
    })
    .select("id, label")
    .single();
  let immutable = false;
  if (!versionError && version) {
    const { data: updated, error: updateError } = await client
      .from("document_versions")
      .update({ label: "Mutated version" })
      .eq("id", version.id)
      .select("id");
    immutable = Boolean(updateError) || updated.length === 0;
  }
  const { data: createdRoom, error: roomError } = await client.rpc(
    "create_study_room",
    {
      input_is_public: false,
      input_name: "Capacity supplemental manager room",
    },
  );
  const createdRoomId = createdRoom?.[0]?.room_id;
  if (createdRoomId) await admin.from("rooms").delete().eq("id", createdRoomId);
  return {
    createdRoom: !roomError && typeof createdRoomId === "string",
    immutableVersion: immutable,
    label: "http-management-version-surfaces",
    phase: "phase-6",
    routeLatency: summarize(routeResults.map((result) => result.latencyMs)),
    routeStatuses: Object.fromEntries(
      routes.map((route, index) => [route, routeResults[index].status]),
    ),
    supported:
      routeResults.every((result) => result.status === 200) &&
      !versionError &&
      immutable &&
      !roomError &&
      typeof createdRoomId === "string",
    versionCreated: !versionError && Boolean(version),
  };
}

async function runSupplemental() {
  await ensureArtifactsDir();
  const state = await readState();
  const sharedA = state.rooms.find((room) => room.kind === "shared-a");
  const metrics = JSON.parse(await readFile(rawPath, "utf8"));
  const labels = new Set([
    "viewers-only-25",
    "viewers-only-50",
    "presence-presentation-25",
    "reconnect-storm-50pct",
    "http-management-version-surfaces",
  ]);
  metrics.steps = metrics.steps.filter((step) => !labels.has(step.label));
  for (const users of [25, 50]) {
    metrics.steps.push(
      await runStep({
        holdSeconds: 60,
        label: `viewers-only-${users}`,
        phase: "phase-6",
        rooms: [sharedA],
        users,
        viewerOnly: true,
      }),
    );
  }
  metrics.steps.push(await runPresenceProbe(state));
  metrics.steps.push(await runReconnectStorm(state));
  metrics.steps.push(await runHttpAndVersionProbe(state));
  await writeFile(rawPath, JSON.stringify(metrics, null, 2));
  await writeFile(summaryPath, JSON.stringify(buildSummary(metrics), null, 2));
  console.log("Supplemental coverage complete.");
}

async function runCapacity() {
  await ensureArtifactsDir();
  const state = await readState();
  const resumeFrom = process.env.CAPACITY_RESUME_FROM ?? null;
  const phaseRank = {
    "phase-1": 1,
    "phase-2": 2,
    "phase-3": 3,
    "phase-4": 4,
    "phase-5": 5,
    "phase-6": 6,
  };
  const shouldRun = (phase) =>
    !resumeFrom || phaseRank[phase] >= phaseRank[resumeFrom];
  const health = await healthCheck();
  if (!health.ok) {
    throw new Error(`Yjs health check failed at ${yjsWsUrl}.`);
  }
  const login = await timedFetch("/login", "");
  if (login.status !== 200) {
    throw new Error(
      `App baseline failed: GET /login returned ${login.status}.`,
    );
  }

  const sharedA = state.rooms.find((room) => room.kind === "shared-a");
  const sharedB = state.rooms.find((room) => room.kind === "shared-b");
  const privateRooms = state.rooms.filter((room) => room.kind === "private");
  const metrics = resumeFrom
    ? JSON.parse(await readFile(rawPath, "utf8"))
    : {
        environment: {
          aiMode: "off",
          baseUrl,
          nodeVersion: process.version,
          poolSize: state.accounts.length,
          roomCount: state.rooms.length,
          safetyMode: "local-dev with disposable remote Supabase data",
          startedAt: new Date().toISOString(),
          timeScale: scale,
          yjsWsUrl,
        },
        phase0: {
          health,
          idleResources: await processSample(),
          loginPage: login,
        },
        steps: [],
      };
  if (resumeFrom) {
    metrics.steps = metrics.steps.filter((step) => {
      const normalizedPhase = step.phase?.startsWith("phase-5")
        ? "phase-5"
        : step.phase;
      return (phaseRank[normalizedPhase] ?? Infinity) < phaseRank[resumeFrom];
    });
    metrics.environment.resumedAt = new Date().toISOString();
    metrics.environment.resumedFrom = resumeFrom;
  }

  async function executeLadder(configs) {
    for (const config of configs) {
      const result = await runStep(config);
      metrics.steps.push(result);
      await writeFile(rawPath, JSON.stringify(metrics, null, 2));
      if (
        result.httpErrorRate > 0.05 ||
        result.wsSuccessRate < 0.9 ||
        (result.editPropagation.p50 ?? 0) > 5_000 ||
        !result.health.after
      ) {
        console.log(
          `[${result.phase}] hard stop triggered; stopping this ladder.`,
        );
        break;
      }
    }
  }

  if (shouldRun("phase-1")) {
    await executeLadder(
      [2, 5, 10].map((users) => ({
        holdSeconds: 180,
        label: `smoke-${users}`,
        phase: "phase-1",
        rooms: [sharedA],
        users,
      })),
    );
  }

  if (shouldRun("phase-2")) {
    await executeLadder(
      [5, 10, 20, 30, 50, 75].map((users) => ({
        holdSeconds: 60,
        label: `single-notes-${users}`,
        phase: "phase-2",
        rooms: [sharedA],
        users,
      })),
    );
    for (const kind of ["pdf", "whiteboard"]) {
      await executeLadder(
        [10, 50, 75].map((users) => ({
          holdSeconds: 60,
          kind,
          label: `single-${kind}-${users}`,
          phase: "phase-2",
          rooms: [kind === "pdf" ? sharedB : sharedA],
          users,
        })),
      );
    }
  }

  if (shouldRun("phase-3")) {
    await executeLadder(
      [25, 50, 100, 150, 200, 300].map((users) => ({
        holdSeconds: 90,
        label: `multi-room-${users}`,
        phase: "phase-3",
        rooms: privateRooms.slice(0, users),
        users,
      })),
    );
  }

  if (shouldRun("phase-4")) {
    await executeLadder(
      [25, 50, 75, 100, 150, 200, 250, 300, 400].map((users) => ({
        holdSeconds: 180,
        label: `mixed-${users}`,
        phase: "phase-4",
        rooms: [
          sharedA,
          sharedB,
          ...privateRooms.slice(0, Math.max(1, Math.ceil(users / 3))),
        ],
        users,
      })),
    );
  }

  const mixedPassing = metrics.steps
    .filter((step) => step.phase === "phase-4" && step.supported)
    .map((step) => step.concurrency);
  const maxPass = Math.max(0, ...mixedPassing);
  if (maxPass > 0 && shouldRun("phase-5")) {
    await executeLadder([
      {
        holdSeconds: 120,
        label: `spike-${maxPass * 2}`,
        phase: "phase-5-spike",
        rooms: [
          sharedA,
          sharedB,
          ...privateRooms.slice(0, Math.max(1, Math.ceil(maxPass / 3))),
        ],
        users: maxPass * 2,
      },
    ]);
    await executeLadder([
      {
        holdSeconds: 1_200,
        label: `soak-${maxPass}`,
        phase: "phase-5-soak",
        rooms: [
          sharedA,
          sharedB,
          ...privateRooms.slice(0, Math.max(1, Math.ceil(maxPass / 3))),
        ],
        users: maxPass,
      },
    ]);
  }

  if (shouldRun("phase-6")) {
    await executeLadder([
      {
        holdSeconds: 60,
        label: "viewers-only-300",
        phase: "phase-6",
        rooms: [sharedA],
        users: 300,
        viewerOnly: true,
      },
    ]);
    metrics.steps.push(await runViewerWriteProtection(state));
    metrics.steps.push(await runOfflineMerge(state));
    metrics.steps.push(await runUnauthorized(state));
    const largeRoom = await preseedLargeDocument(state);
    metrics.steps.push(
      await runStep({
        holdSeconds: 60,
        label: "large-document-25",
        phase: "phase-6",
        rooms: [largeRoom],
        users: 25,
      }),
    );
    metrics.steps.push(await runPdfRouteProbe(state));
  }

  metrics.environment.endedAt = new Date().toISOString();
  await writeFile(rawPath, JSON.stringify(metrics, null, 2));
  const summary = buildSummary(metrics);
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

async function shakedown() {
  await ensureArtifactsDir();
  const state = await readState();
  const sharedA = state.rooms.find((room) => room.kind === "shared-a");
  const result = await runStep({
    holdSeconds: 5,
    label: "runner-shakedown",
    phase: "shakedown",
    rooms: [sharedA],
    users: 2,
  });
  const viewerProtection = await runViewerWriteProtection(state);
  const unauthorized = await runUnauthorized(state);
  const output = { result, unauthorized, viewerProtection };
  await writeFile(
    new URL("shakedown.json", artifactsDir),
    JSON.stringify(output, null, 2),
  );
  console.log(
    `Shakedown ${result.supported && viewerProtection.supported && unauthorized.supported ? "passed" : "failed"}.`,
  );
  if (
    !result.supported ||
    !viewerProtection.supported ||
    !unauthorized.supported
  ) {
    process.exitCode = 1;
  }
}

function buildSummary(metrics) {
  const loadSteps = metrics.steps.filter((step) => "concurrency" in step);
  const passing = (phase) =>
    loadSteps
      .filter((step) => step.phase === phase && step.supported)
      .map((step) => step.concurrency);
  const maxMixed = Math.max(0, ...passing("phase-4"));
  const maxNotes = Math.max(
    0,
    ...loadSteps
      .filter(
        (step) =>
          step.phase === "phase-2" && step.kind === "notes" && step.supported,
      )
      .map((step) => step.concurrency),
  );
  const maxRooms = Math.max(
    0,
    ...loadSteps
      .filter((step) => step.phase === "phase-3" && step.supported)
      .map((step) => step.roomsActive),
  );
  const maxViewers = Math.max(
    0,
    ...loadSteps
      .filter(
        (step) =>
          step.phase === "phase-6" &&
          step.label.startsWith("viewers-only") &&
          step.supported,
      )
      .map((step) => step.concurrency),
  );
  const failures = loadSteps.filter((step) => !step.supported);
  return {
    confidence: scale === 1 ? "medium" : "low",
    failedSteps: failures.map((step) => ({
      checks: step.sloChecks,
      label: step.label,
    })),
    maxConcurrentEditorsOneNotesDocument: maxNotes,
    maxConcurrentLiveRooms: maxRooms,
    maxConcurrentUsersMixed: maxMixed,
    maxConcurrentViewers: maxViewers,
    primaryBottleneck:
      failures.length === 0
        ? "Not reached within tested ladder"
        : Object.entries(failures[0].sloChecks ?? {})
            .filter(([, passed]) => !passed)
            .map(([name]) => name)
            .join(", "),
    safeOperatingCapacity: Math.floor(maxMixed * 0.7),
    testDurationScale: scale,
  };
}

async function cleanup() {
  await ensureArtifactsDir();
  let state;
  try {
    state = await readState();
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.log("No capacity test state exists; nothing to clean.");
      return;
    }
    throw error;
  }

  console.log(`Cleaning ${state.rooms.length} rooms...`);
  for (const group of chunk(
    state.rooms.map((room) => room.id),
    100,
  )) {
    const { error } = await admin.from("rooms").delete().in("id", group);
    if (error) throw new Error(`Room cleanup failed: ${error.message}`);
  }
  console.log(`Cleaning ${state.accounts.length} users...`);
  await mapLimit(state.accounts, 4, async (account) => {
    const { error } = await admin.auth.admin.deleteUser(account.id);
    if (error && !error.message.toLowerCase().includes("not found")) {
      throw new Error(`User cleanup failed: ${error.message}`);
    }
  });
  await rm(statePath, { force: true });
  await rm(new URL("browser-account.json", artifactsDir), { force: true });
  await writeFile(
    new URL("cleanup.json", artifactsDir),
    JSON.stringify(
      {
        cleanedAt: new Date().toISOString(),
        roomsDeleted: state.rooms.length,
        usersDeleted: state.accounts.length,
      },
      null,
      2,
    ),
  );
  console.log("Disposable capacity-test data cleaned.");
}

switch (mode) {
  case "prepare":
    await prepare();
    break;
  case "run":
    await runCapacity();
    break;
  case "shakedown":
    await shakedown();
    break;
  case "supplemental":
    await runSupplemental();
    break;
  case "cleanup":
    await cleanup();
    break;
  default:
    console.log(
      "Usage: node --env-file=.env scripts/run-concurrent-capacity.mjs prepare|shakedown|run|supplemental|cleanup",
    );
}
