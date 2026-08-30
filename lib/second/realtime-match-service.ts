"use client";

import { io, type Socket } from "socket.io-client";
import type { CanonicalMatchState, ClientToServerEvents, ServerToClientEvents } from "@/server/realtime/socket-events";
import type { TonightSignals } from "@/server/realtime/validation";

type Listener = (state: CanonicalMatchState) => void;
type ErrorListener = () => void;
type Ack = { ok: boolean; error?: string };
type WithoutAck<T> = T extends [...infer Payload, (...args: never[]) => unknown] ? Payload : never;

export class RealtimeMatchService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners = new Set<Listener>();
  private errorListeners = new Set<ErrorListener>();
  private latest: CanonicalMatchState | null = null;

  subscribe(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  subscribeError(listener: ErrorListener) { this.errorListeners.add(listener); return () => this.errorListeners.delete(listener); }
  get state() { return this.latest; }
  private publish = (state: CanonicalMatchState) => { this.latest = state; this.listeners.forEach((listener) => listener(state)); };
  private publishUnavailable = () => this.errorListeners.forEach((listener) => listener());

  async start(signals: TonightSignals) {
    const response = await fetch("/api/tonight-session", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(signals) });
    if (!response.ok) throw new Error("Please complete your tonight signals before joining the queue.");
    if (!this.socket) this.connect();
    await this.emit("queue.join", { signals: {} });
  }
  async restore(signal?: AbortSignal) {
    const response = await fetch("/api/match-state", { credentials: "same-origin", cache: "no-store", signal });
    if (!response.ok) return null;
    const body = await response.json() as { state?: CanonicalMatchState };
    if (signal?.aborted) return null;
    if (body.state) this.publish(body.state);
    if (!this.socket) this.connect();
    return body.state ?? null;
  }
  cancelQueue() { return this.emit("queue.cancel"); }
  accept() { return this.emit("candidate.accept"); }
  pass() { return this.emit("candidate.pass"); }
  block() { return this.emit("candidate.block"); }
  beginConnection() { return this.emit("connection.begin"); }
  endConnection() { return this.emit("connection.end"); }
  continueConnection() { return this.emit("connection.continue"); }
  finishConnection() { return this.emit("connection.finish"); }
  leave() { return this.emit("match.leave"); }
  async endTonight() { await fetch("/api/end-tonight", { method: "POST", credentials: "same-origin" }); this.socket?.disconnect(); }
  async report(reason: "unsafe" | "harassment" | "impersonation" | "other") { await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ reason }) }); }
  disconnect() { this.socket?.disconnect(); this.socket = null; }

  private connect() {
    const socket = io({ path: "/socket.io/", withCredentials: true, transports: ["websocket", "polling"] });
    this.socket = socket;
    const events: (keyof ServerToClientEvents)[] = ["queue.joined", "queue.updated", "candidate.created", "candidate.unavailable", "candidate.accepted_waiting", "match.mutual", "connection.started", "connection.ended", "match.state"];
    for (const event of events) socket.on(event, this.publish as never);
    socket.on("match.error", this.publishUnavailable);
    socket.on("connect_error", this.publishUnavailable);
  }
  private emit<Event extends keyof ClientToServerEvents>(event: Event, ...args: WithoutAck<Parameters<ClientToServerEvents[Event]>>) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error("Realtime connection is unavailable"));
      const ack = (error: Error | null, result: Ack) => error || !result?.ok ? reject(new Error("Realtime connection is unavailable")) : resolve();
      (this.socket.timeout(7_000).emit as (...values: unknown[]) => void)(event, ...args, ack);
    });
  }
}
