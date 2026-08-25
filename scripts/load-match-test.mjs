import { performance } from "node:perf_hooks";
import { WebSocket } from "ws";

const url = process.argv[2] ?? "ws://127.0.0.1:3102/ws";
const count = Number(process.argv[3] ?? 100);
const timeoutMs = Number(process.argv[4] ?? 30_000);
const holdMs = Number(process.argv[5] ?? 0);

if (!Number.isInteger(count) || count < 2 || count % 2 !== 0) {
  throw new Error("client count must be a positive even integer");
}

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const startedAt = performance.now();
const sockets = [];
let opened = 0;
let matched = 0;
let requests = 0;
let talks = 0;
let errors = 0;
let closes = 0;
let firstTalkMs = 0;
let lastTalkMs = 0;

const finished = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`timeout: opened=${opened} matched=${matched} requests=${requests} talks=${talks} errors=${errors} closes=${closes}`)), timeoutMs);
  for (let index = 0; index < count; index += 1) {
    const ws = new WebSocket(url, { origin: "https://xinxinyuntu.top" });
    sockets.push(ws);
    ws.on("open", () => {
      opened += 1;
      ws.send(JSON.stringify({
        type: "join",
        protocolVersion: 2,
        mode: "active",
        clientId: `load-${runId}-${index}`,
        person: { name: `Load ${index}`, age: 24, heightCm: 170, location: `Table ${index}` },
      }));
    });
    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "matched") matched += 1;
      if (data.type === "approach_request") {
        requests += 1;
        ws.send(JSON.stringify({ type: "accept" }));
      }
      if (data.type === "talk_started") {
        talks += 1;
        const elapsed = performance.now() - startedAt;
        if (!firstTalkMs) firstTalkMs = elapsed;
        lastTalkMs = elapsed;
        if (talks === count) {
          clearTimeout(timeout);
          resolve();
        }
      }
      if (data.type === "error" || data.type === "profile_incomplete") errors += 1;
    });
    ws.on("error", () => { errors += 1; });
    ws.on("close", () => { closes += 1; });
  }
});

try {
  await finished;
  if (holdMs > 0) await new Promise((resolve) => setTimeout(resolve, holdMs));
  const memory = process.memoryUsage();
  console.log(JSON.stringify({
    ok: true,
    count,
    pairs: count / 2,
    opened,
    matched,
    requests,
    talks,
    errors,
    closes,
    firstTalkMs: Math.round(firstTalkMs),
    allTalksMs: Math.round(lastTalkMs),
    holdMs,
    clientRssMb: Math.round(memory.rss / 1024 / 1024),
  }));
} finally {
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "finish" }));
      ws.send(JSON.stringify({ type: "set_mode", mode: "inactive" }));
      ws.send(JSON.stringify({ type: "rejoin" }));
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  for (const ws of sockets) ws.close();
  await new Promise((resolve) => setTimeout(resolve, 250));
}
