import assert from "node:assert/strict";
import { createDocumentPersistence } from "../server/document-persistence.mjs";
import { shutdownCollaboration } from "../server/collaboration-shutdown.mjs";

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const started = deferred();
const finishFirst = deferred();
const writes = [];
let concurrent = 0;
let maximumConcurrent = 0;
const document = { value: "first" };
const persistence = createDocumentPersistence({
  delay: 60_000,
  onError: () => assert.fail("Unexpected background failure"),
  save: async (_name, current) => {
    concurrent += 1;
    maximumConcurrent = Math.max(maximumConcurrent, concurrent);
    const snapshot = current.value;
    if (writes.length === 0) {
      started.resolve();
      await finishFirst.promise;
    }
    writes.push(snapshot);
    concurrent -= 1;
  },
});
persistence.schedule("notes", document);
const first = persistence.flush("notes");
await started.promise;
document.value = "latest offline edit";
persistence.schedule("notes", document);
const final = persistence.flushAll();
finishFirst.resolve();
await Promise.all([first, final]);
assert.deepEqual(writes, ["first", "latest offline edit"]);
assert.equal(
  maximumConcurrent,
  1,
  "No overlapping saves can overwrite a newer snapshot",
);
persistence.release("notes", document);

let fail = true;
const attempts = [];
const failures = createDocumentPersistence({
  delay: 60_000,
  onError() {},
  save: async (name) => {
    attempts.push(name);
    if (fail && name === "closed-document")
      throw new Error("secret backend text");
  },
});
failures.schedule("closed-document", {});
failures.schedule("healthy-document", {});
await assert.rejects(failures.flushAll(), (error) => {
  assert.ok(error instanceof AggregateError);
  assert.equal(error.errors.length, 1);
  assert.ok(!JSON.stringify(error.errors).includes("secret"));
  return true;
});
assert.ok(
  attempts.includes("healthy-document"),
  "One failed save does not skip other documents",
);
fail = false;
await failures.flushAll();
assert.equal(attempts.filter((name) => name === "closed-document").length, 2);

const events = [];
const order = [];
assert.equal(
  await shutdownCollaboration({
    stopAccepting: () => order.push("stop"),
    drain: async () => {
      order.push("drain");
    },
    flush: async () => {
      order.push("flush");
    },
    log: (event) => events.push(event),
  }),
  0,
);
assert.deepEqual(order, ["stop", "drain", "flush"]);
assert.equal(
  await shutdownCollaboration({
    stopAccepting() {},
    drain: async () => {},
    flush: async () => {
      throw new Error("private payload");
    },
    log: (event) => events.push(event),
  }),
  1,
);
assert.equal(
  await shutdownCollaboration({
    stopAccepting() {},
    drain: async () => {},
    flush: () => new Promise(() => {}),
    timeoutMs: 5,
    log: (event) => events.push(event),
  }),
  1,
);
assert.deepEqual(
  events.map((event) => event.outcome),
  ["saved", "failed", "timeout"],
);
assert.ok(!JSON.stringify(events).includes("private"));
console.log(
  "PASS: serialized latest snapshots, closed-document retry, aggregate failures, shutdown order/failure/deadline and sanitized logs",
);

// Exercise the real standalone signal/exit path with a local runtime stub.
const { spawn } = await import("node:child_process");
const { createServer } = await import("node:net");
const runtimeStub = `
export const attachDocumentConnection = () => {};
export const attachPresenceConnection = () => {};
export const authorizeCollaborationRequest = async () => ({ error: 'Unauthorized', status: 401 });
export const prepareCollaborationConnection = async () => {};
export const stopCollaborationUpdates = () => {};
export const flushCollaborationDocuments = async () => {
  if (process.env.COLLAB_TEST_MODE === 'failed') throw new Error('private failure');
  if (process.env.COLLAB_TEST_MODE === 'timeout') await new Promise(() => {});
};
`;
const loader = `
export function resolve(specifier, context, next) {
  if (specifier === './yjs-runtime.mjs' && context.parentURL.endsWith('/server/yjs-server.mjs')) {
    return { url: ${JSON.stringify(`data:text/javascript,${encodeURIComponent(runtimeStub)}`)}, shortCircuit: true };
  }
  return next(specifier, context);
}`;
const registration = `import { register } from 'node:module';
register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(loader)}`)});`;

async function verifyProcess(mode, expectedCode) {
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(registration)}`,
      "server/yjs-server.mjs",
    ],
    {
      env: {
        ...process.env,
        YJS_HOST: "127.0.0.1",
        YJS_PORT: String(port),
        COLLAB_TEST_MODE: mode,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  let errors = "";
  const exited = new Promise((resolve) =>
    child.once("exit", (code) => resolve(code)),
  );
  child.stderr.on("data", (chunk) => {
    errors += chunk;
  });
  const guard = setTimeout(() => child.kill("SIGKILL"), 15_000);
  try {
    await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", () =>
        reject(new Error("Standalone exited before listening")),
      );
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes('"event":"collaboration_listening"')) resolve();
      });
    });
    assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);
    child.kill("SIGTERM");
    assert.equal(await exited, expectedCode, errors);
    assert.ok(output.includes(`"outcome":"${mode}"`));
    assert.ok(!output.includes("private failure"));
  } finally {
    clearTimeout(guard);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}
await verifyProcess("saved", 0);
await verifyProcess("failed", 1);
await verifyProcess("timeout", 1);
console.log(
  "PASS: standalone SIGTERM exits 0 on success and 1 on failed/hung persistence (local runtime stub)",
);
