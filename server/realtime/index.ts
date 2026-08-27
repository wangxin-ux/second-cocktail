import { createServer } from "node:http";
import { Server } from "socket.io";
import { getSessionByToken, parseCookie, touchSession, type ServerSession } from "./session";
import { beginConnection, cancelQueue, decide, decideConnectionContinuation, endConnection, expireRealtimeState, getCanonicalState, joinQueue, leaveMatch } from "./matchmaker";
import { allowRateLimit } from "./rate-limit";
import type { CanonicalMatchState, ClientToServerEvents, ServerToClientEvents } from "./socket-events";
import { getMeetingAreas } from "./venue-config";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the realtime match server.");
getMeetingAreas();

const port = Number(process.env.REALTIME_PORT ?? 3002);
const host = process.env.REALTIME_HOST ?? "127.0.0.1";
const origin = process.env.APP_ORIGIN ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
if (!origin) throw new Error("APP_ORIGIN is required for the realtime match server in production.");
const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ status: "ok", service: "realtime" }));
    return;
  }
  response.writeHead(404).end();
});
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, { cors: { origin, credentials: true } });
type AuthSocket = Parameters<typeof io.on>[1] extends (socket: infer S) => unknown ? S & { data: { session: ServerSession } } : never;

function room(sessionId: string) { return `session:${sessionId}`; }
function publish(states: Awaited<ReturnType<typeof joinQueue>>, event: keyof ServerToClientEvents = "match.state") {
  for (const { sessionId, state } of states) {
    const target = io.to(room(sessionId)) as unknown as { emit(name: keyof ServerToClientEvents, value: CanonicalMatchState): void };
    target.emit(event, state);
  }
}
function genericError() { return "Realtime connection is unavailable"; }

io.use(async (socket, next) => {
  try {
    const session = await getSessionByToken(parseCookie(socket.handshake.headers.cookie));
    if (!session) return next(new Error("Authentication required"));
    socket.data.session = session;
    return next();
  } catch {
    return next(new Error("Authentication unavailable"));
  }
});

io.on("connection", (socket) => {
  const authed = socket as AuthSocket;
  const session = authed.data.session;
  socket.join(room(session.id));
  void touchSession(session.id);
  const presenceHeartbeat = setInterval(() => {
    void touchSession(session.id);
  }, 20_000);
  void getCanonicalState(session.id).then((state) => socket.emit("match.state", state)).catch(() => socket.emit("match.error", "Unable to restore match state"));
  const run = (work: () => Promise<Awaited<ReturnType<typeof joinQueue>>>, event: keyof ServerToClientEvents, ack: (result: { ok: boolean; error?: string }) => void) => {
    if (!allowRateLimit(session.id)) return ack({ ok: false, error: "Please slow down and try again." });
    void touchSession(session.id);
    void work().then((states) => { publish(states, event); ack({ ok: true }); }).catch(() => { socket.emit("match.error", genericError()); ack({ ok: false, error: genericError() }); });
  };
  socket.on("queue.join", (_payload, ack) => run(() => joinQueue(session), "queue.joined", ack));
  socket.on("queue.cancel", (ack) => run(() => cancelQueue(session.id), "queue.updated", ack));
  socket.on("candidate.accept", (ack) => run(() => decide(session, "accept"), "candidate.accepted_waiting", ack));
  socket.on("candidate.pass", (ack) => run(() => decide(session, "pass"), "candidate.unavailable", ack));
  socket.on("candidate.block", (ack) => run(() => decide(session, "block"), "candidate.unavailable", ack));
  socket.on("connection.begin", (ack) => run(() => beginConnection(session), "connection.started", ack));
  socket.on("connection.end", (ack) => run(() => endConnection(session.id), "connection.ended", ack));
  socket.on("connection.continue", (ack) => run(() => decideConnectionContinuation(session, true), "match.state", ack));
  socket.on("connection.finish", (ack) => run(() => decideConnectionContinuation(session, false), "connection.ended", ack));
  socket.on("match.leave", (ack) => run(() => leaveMatch(session.id), "queue.updated", ack));
  socket.on("disconnect", () => clearInterval(presenceHeartbeat));
});

setInterval(() => {
  void expireRealtimeState().then((states) => {
    for (const item of states) publish([item], item.kind === "connection" ? "connection.ended" : "candidate.unavailable");
  }).catch(() => undefined);
}, 5_000).unref();

httpServer.listen(port, host, () => console.info(`Second realtime server listening on ${host}:${port}`));
