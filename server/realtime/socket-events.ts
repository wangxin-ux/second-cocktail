import type { CandidatePreview } from "@/lib/second/candidate-visibility";

export type RealtimeStage = "waiting" | "candidate" | "waiting_for_other" | "mutual" | "connection" | "time_up" | "waiting_for_continue" | "continuing" | "ended" | "idle";
export type MeetingArea = { id: string; label: string; labelZh: string };

export type CanonicalMatchState = {
  stage: RealtimeStage;
  serverNow: string;
  enteredQueueAt?: string;
  pairId?: string;
  candidate?: CandidatePreview;
  meetingArea?: MeetingArea;
  startedAt?: string;
  endsAt?: string;
  continueIntent?: boolean;
  message?: "candidate_unavailable" | "connection_ended";
};

export type ClientToServerEvents = {
  "queue.join": (payload: { signals: unknown }, ack: (result: { ok: boolean; error?: string }) => void) => void;
  "queue.cancel": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "candidate.accept": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "candidate.pass": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "candidate.block": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "connection.begin": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "connection.end": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "connection.continue": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "connection.finish": (ack: (result: { ok: boolean; error?: string }) => void) => void;
  "match.leave": (ack: (result: { ok: boolean; error?: string }) => void) => void;
};

export type ServerToClientEvents = {
  "queue.joined": (state: CanonicalMatchState) => void;
  "queue.updated": (state: CanonicalMatchState) => void;
  "candidate.created": (state: CanonicalMatchState) => void;
  "candidate.unavailable": (state: CanonicalMatchState) => void;
  "candidate.accepted_waiting": (state: CanonicalMatchState) => void;
  "match.mutual": (state: CanonicalMatchState) => void;
  "connection.started": (state: CanonicalMatchState) => void;
  "connection.ended": (state: CanonicalMatchState) => void;
  "match.state": (state: CanonicalMatchState) => void;
  "match.error": (message: string) => void;
};
