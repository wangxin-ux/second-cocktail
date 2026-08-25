import { WebSocket } from "ws";

const url = process.argv[2] ?? "ws://127.0.0.1:3102/ws";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const open = (origin) => new Promise((resolve, reject) => {
  const ws = new WebSocket(url, { origin });
  ws.once("open", () => resolve(ws));
  ws.once("error", reject);
});
const join = (ws, clientId, mode = "inactive") => ws.send(JSON.stringify({
  type: "join",
  protocolVersion: 2,
  mode,
  clientId,
  person: { name: "Security test", age: 24, heightCm: 170, location: "Test table" },
}));

const results = {};

const crossOrigin = await open("https://evil.example");
let crossOriginReply = "";
crossOrigin.on("message", (raw) => { crossOriginReply = JSON.parse(raw.toString()).type; });
join(crossOrigin, `origin-${Date.now()}`);
await wait(150);
results.crossOriginAccepted = crossOriginReply === "inactive";
crossOrigin.close();

const malformed = await open("https://xinxinyuntu.top");
let malformedReply = "";
malformed.on("message", (raw) => { malformedReply = JSON.parse(raw.toString()).type; });
malformed.send("{not-json");
await wait(150);
results.malformedHandled = malformedReply === "error" && malformed.readyState === WebSocket.OPEN;
malformed.close();

const large = await open("https://xinxinyuntu.top");
large.send(JSON.stringify({ type: "unknown", padding: "x".repeat(1024 * 1024) }));
await wait(250);
results.oneMegabyteAccepted = large.readyState === WebSocket.OPEN;
large.close();

const duplicateId = `duplicate-${Date.now()}`;
const first = await open("https://xinxinyuntu.top");
let firstCloseCode = 0;
first.on("close", (code) => { firstCloseCode = code; });
join(first, duplicateId, "active");
await wait(100);
const second = await open("https://evil.example");
join(second, duplicateId, "inactive");
await wait(250);
results.duplicateIdDisplacedExistingClient = firstCloseCode === 4001;
second.close();

console.log(JSON.stringify(results));
