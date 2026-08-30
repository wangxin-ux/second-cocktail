import type { PoolClient } from "pg";
import { withTransaction } from "@/server/db/client";
import { projectCandidatePreview, type CandidatePreview } from "@/lib/second/candidate-visibility";
import type { MatchCandidate } from "@/lib/second/match-types";
import type { CanonicalMatchState, MeetingArea } from "./socket-events";
import type { ServerSession } from "./session";
import { randomUUID } from "./validation";
import { getMeetingAreas } from "./venue-config";

const candidateLifetimeSeconds = 90;
const connectionLifetimeSeconds = 5 * 60;
const queueLifetimeSeconds = 12 * 60 * 60;
export const presenceGraceSeconds = 60;

function meetingAreas(): readonly MeetingArea[] { return getMeetingAreas(); }

type PairRow = {
  id: string; session_a_id: string; session_b_id: string; status: string; a_decision: string | null; b_decision: string | null;
  a_continue: boolean | null; b_continue: boolean | null;
  candidate_expires_at: Date; meeting_area_id: string | null; created_at: Date;
  connection_id: string | null; started_at: Date | null; ends_at: Date | null; ended_at: Date | null;
};
type QueueRow = { entered_queue_at: Date };

function iso(value: Date | string | null | undefined) { return value ? new Date(value).toISOString() : undefined; }
function otherId(pair: PairRow, sessionId: string) { return pair.session_a_id === sessionId ? pair.session_b_id : pair.session_a_id; }
function decisionFor(pair: PairRow, sessionId: string) { return pair.session_a_id === sessionId ? pair.a_decision : pair.b_decision; }
function areaById(id: string | null): MeetingArea | undefined { return meetingAreas().find((area) => area.id === id); }

function candidateFromSession(viewer: ServerSession, session: ServerSession): CandidatePreview {
  const signals = session.energy === "open" ? ["Warm and open to a first hello", "擅长把陌生的夜晚聊热"]
    : session.energy === "slow" ? ["Comfortable with a quieter pace", "更喜欢慢一点的靠近"]
      : ["Brings a playful spark", "带着一点即兴的火花"];
  const candidate: MatchCandidate = {
    id: session.id, nickname: session.nickname, age: session.age, mbti: session.mbti,
    energy: session.energy, spirit: session.spirit, flavor: session.flavor, drink: session.cocktailName,
    personalitySignal: signals[0], personalitySignalZh: signals[1],
  };
  const reasons = [
    viewer.energy === session.energy
      ? { id: "shared-energy", en: "You arrived with a similar intention for tonight.", zh: "你们今晚带着相近的状态而来。" }
      : { id: "complementary-energy", en: "Your different energies could make an easy first exchange.", zh: "不同的今晚状态，或许刚好能打开一段对话。" },
    viewer.flavor === session.flavor
      ? { id: "shared-flavor", en: "You chose a similar flavour direction tonight.", zh: "你们今晚选择了相近的风味方向。" }
      : { id: "drink-contrast", en: "Your drink preferences offer an easy first topic.", zh: "不同的风味偏好，可以自然地接上话。" },
  ];
  const openingPrompt = { en: `What made ${session.cocktailName} feel right tonight?`, zh: `今晚为什么选了「${session.cocktailName}」？` };
  return projectCandidatePreview(candidate, reasons, openingPrompt);
}

async function sessionById(client: Pick<PoolClient, "query">, id: string): Promise<ServerSession | null> {
  const result = await client.query<{
    id: string; nickname: string; age: number; age_band: number; energy: ServerSession["energy"]; mbti: ServerSession["mbti"] | null;
    spirit: ServerSession["spirit"]; flavor: ServerSession["flavor"]; cocktail_id: string; cocktail_name: string; venue_id: string; invalidated_at: string | null;
  }>(`SELECT id,nickname,age,age_band,energy,mbti,spirit,flavor,cocktail_id,cocktail_name,venue_id,invalidated_at FROM tonight_sessions WHERE id=$1 AND invalidated_at IS NULL AND expires_at>NOW()`, [id]);
  const row = result.rows[0];
  return row ? { id: row.id, venueId: row.venue_id, nickname: row.nickname, age: row.age, ageBand: row.age_band, energy: row.energy, ...(row.mbti ? { mbti: row.mbti } : {}), spirit: row.spirit, flavor: row.flavor, cocktailId: row.cocktail_id, cocktailName: row.cocktail_name, invalidatedAt: row.invalidated_at } : null;
}

async function pairFor(client: Pick<PoolClient, "query">, sessionId: string, lock = false): Promise<PairRow | null> {
  const result = await client.query<PairRow>(`SELECT p.*, c.id AS connection_id,c.started_at,c.ends_at,c.ended_at
    FROM match_pairs p LEFT JOIN connections c ON c.match_pair_id=p.id
    WHERE (p.session_a_id=$1 OR p.session_b_id=$1) AND p.status IN ('candidate','waiting_for_other','mutual','connection','time_up','continuing')
    ORDER BY p.created_at DESC LIMIT 1${lock ? " FOR UPDATE OF p" : ""}`, [sessionId]);
  return result.rows[0] ?? null;
}

export async function getCanonicalState(sessionId: string): Promise<CanonicalMatchState> {
  return withTransaction(async (client) => canonicalState(client, sessionId));
}

async function canonicalState(client: Pick<PoolClient, "query">, sessionId: string): Promise<CanonicalMatchState> {
  const pair = await pairFor(client, sessionId);
  if (pair) {
    const viewer = await sessionById(client, sessionId);
    const other = await sessionById(client, otherId(pair, sessionId));
    const candidate = viewer && other ? candidateFromSession(viewer, other) : undefined;
    const base = { serverNow: new Date().toISOString(), pairId: pair.id, ...(candidate ? { candidate } : {}) };
    if (pair.status === "connection" && pair.ends_at && !pair.ended_at) return { ...base, stage: "connection", meetingArea: areaById(pair.meeting_area_id), startedAt: iso(pair.started_at), endsAt: iso(pair.ends_at) };
    if (pair.status === "time_up") return { ...base, stage: decisionForContinue(pair, sessionId) ? "waiting_for_continue" : "time_up", meetingArea: areaById(pair.meeting_area_id), continueIntent: Boolean(decisionForContinue(pair, sessionId)) };
    if (pair.status === "continuing") return { ...base, stage: "continuing", meetingArea: areaById(pair.meeting_area_id), continueIntent: true };
    if (pair.status === "mutual") return { ...base, stage: "mutual", meetingArea: areaById(pair.meeting_area_id) };
    return { ...base, stage: decisionFor(pair, sessionId) === "accept" ? "waiting_for_other" : "candidate" };
  }
  const queue = await client.query<QueueRow>("SELECT entered_queue_at FROM queue_entries WHERE session_id=$1 AND status='waiting' ORDER BY entered_queue_at DESC LIMIT 1", [sessionId]);
  if (queue.rows[0]) return { stage: "waiting", serverNow: new Date().toISOString(), enteredQueueAt: iso(queue.rows[0].entered_queue_at) };
  const ended = await client.query<PairRow>(`SELECT p.*, c.id AS connection_id,c.started_at,c.ends_at,c.ended_at FROM match_pairs p LEFT JOIN connections c ON c.match_pair_id=p.id
    WHERE (p.session_a_id=$1 OR p.session_b_id=$1) AND p.status='ended' ORDER BY p.updated_at DESC LIMIT 1`, [sessionId]);
  if (ended.rows[0]) {
    const pair = ended.rows[0];
    const other = await sessionById(client, otherId(pair, sessionId));
    const viewer = await sessionById(client, sessionId);
    return { stage: "ended", serverNow: new Date().toISOString(), pairId: pair.id, ...(viewer && other ? { candidate: candidateFromSession(viewer, other) } : {}) };
  }
  return { stage: "idle", serverNow: new Date().toISOString() };
}

function decisionForContinue(pair: PairRow, sessionId: string) { return pair.session_a_id === sessionId ? pair.a_continue : pair.b_continue; }

async function enqueue(client: Pick<PoolClient, "query">, session: ServerSession) {
  await client.query(`UPDATE queue_entries SET status='cancelled' WHERE session_id=$1 AND status='waiting'`, [session.id]);
  await client.query(`INSERT INTO queue_entries (id,session_id,venue_id,energy,mbti,age_band,spirit,flavor,expires_at,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()+($9 || ' seconds')::interval,'waiting')`, [randomUUID(), session.id, session.venueId, session.energy, session.mbti ?? null, session.ageBand, session.spirit, session.flavor, queueLifetimeSeconds]);
}

function score(a: ServerSession, b: ServerSession) {
  return (a.energy === b.energy ? 4 : 0) + (a.flavor === b.flavor ? 3 : 0) + (a.spirit === b.spirit ? 2 : 0) + (a.mbti && b.mbti && a.mbti[0] === b.mbti[0] ? 2 : 0) + (Math.abs(a.age - b.age) <= 5 ? 1 : 0);
}

async function tryCreatePair(client: PoolClient, session: ServerSession): Promise<string | null> {
  const candidates = await client.query<{ session_id: string }>(`SELECT q.session_id FROM queue_entries q JOIN tonight_sessions s ON s.id=q.session_id
    WHERE q.status='waiting' AND q.session_id<>$1 AND q.expires_at>NOW() AND q.last_seen_at>NOW()-($2 || ' seconds')::interval
      AND q.venue_id=$3 AND s.venue_id=$3 AND s.invalidated_at IS NULL AND s.expires_at>NOW()
      AND NOT EXISTS (SELECT 1 FROM pair_exclusions x WHERE x.session_low_id=LEAST(q.session_id,$1::uuid) AND x.session_high_id=GREATEST(q.session_id,$1::uuid))
    FOR UPDATE OF q SKIP LOCKED`, [session.id, presenceGraceSeconds, session.venueId]);
  const other = (await Promise.all(candidates.rows.map((row) => sessionById(client, row.session_id)))).filter((value): value is ServerSession => Boolean(value)).sort((a, b) => score(session, b) - score(session, a))[0];
  if (!other) return null;
  await client.query("UPDATE queue_entries SET status='matched' WHERE session_id=ANY($1::uuid[]) AND status='waiting'", [[session.id, other.id]]);
  const pairId = randomUUID();
  await client.query(`INSERT INTO match_pairs (id,session_a_id,session_b_id,venue_id,status,candidate_expires_at)
    VALUES ($1,$2,$3,$4,'candidate',NOW()+($5 || ' seconds')::interval)`, [pairId, session.id, other.id, session.venueId, candidateLifetimeSeconds]);
  return pairId;
}

export async function joinQueue(session: ServerSession) {
  return withTransaction(async (client) => {
    const existing = await pairFor(client, session.id, true);
    if (!existing) {
      await enqueue(client, session);
      await tryCreatePair(client, session);
    }
    return getAffectedStates(client, session.id);
  });
}

async function getAffectedStates(client: Pick<PoolClient, "query">, sessionId: string) {
  const pair = await pairFor(client, sessionId);
  const ids = pair ? [pair.session_a_id, pair.session_b_id] : [sessionId];
  return Promise.all(ids.map(async (id) => ({ sessionId: id, state: await canonicalState(client, id) })));
}

export async function decide(session: ServerSession, decision: "accept" | "pass" | "block") {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, session.id, true);
    if (!pair || !["candidate", "waiting_for_other"].includes(pair.status)) throw new Error("No candidate is available");
    const column = pair.session_a_id === session.id ? "a_decision" : "b_decision";
    if (decision === "accept") {
      await client.query(`UPDATE match_pairs SET ${column}='accept',status='waiting_for_other',updated_at=NOW() WHERE id=$1`, [pair.id]);
      const refreshed = await pairFor(client, session.id, true);
      if (refreshed?.a_decision === "accept" && refreshed.b_decision === "accept") {
        const areas = meetingAreas();
        const area = areas[Math.floor(Math.random() * areas.length)];
        await client.query("UPDATE match_pairs SET status='mutual',mutual_at=NOW(),meeting_area_id=$2,updated_at=NOW() WHERE id=$1", [pair.id, area.id]);
      }
    } else {
      const low = pair.session_a_id < pair.session_b_id ? pair.session_a_id : pair.session_b_id;
      const high = pair.session_a_id < pair.session_b_id ? pair.session_b_id : pair.session_a_id;
      await client.query("INSERT INTO pair_exclusions (session_low_id,session_high_id,reason,expires_at) VALUES ($1,$2,$3,NOW()+INTERVAL '12 hours') ON CONFLICT (session_low_id,session_high_id) DO UPDATE SET reason=EXCLUDED.reason,expires_at=EXCLUDED.expires_at", [low, high, decision]);
      await client.query(`UPDATE match_pairs SET ${column}=$2,status='passed',updated_at=NOW() WHERE id=$1`, [pair.id, decision]);
      for (const id of [pair.session_a_id, pair.session_b_id]) {
        const peer = await sessionById(client, id);
        if (peer) await enqueue(client, peer);
      }
      for (const id of [pair.session_a_id, pair.session_b_id]) {
        const peer = await sessionById(client, id);
        if (peer) await tryCreatePair(client, peer);
      }
      return Promise.all(
        [pair.session_a_id, pair.session_b_id].map(async (id) => ({ sessionId: id, state: await canonicalState(client, id) })),
      );
    }
    return getAffectedStates(client, session.id);
  });
}

export async function cancelQueue(sessionId: string) {
  return withTransaction(async (client) => {
    await client.query("UPDATE queue_entries SET status='cancelled' WHERE session_id=$1 AND status='waiting'", [sessionId]);
    return [{ sessionId, state: await canonicalState(client, sessionId) }];
  });
}

export async function beginConnection(session: ServerSession) {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, session.id, true);
    if (!pair || pair.status !== "mutual" || !pair.meeting_area_id) throw new Error("A mutual match is required");
    await client.query(`INSERT INTO connections (id,match_pair_id,meeting_area_id,started_at,ends_at)
      VALUES ($1,$2,$3,NOW(),NOW()+($4 || ' seconds')::interval) ON CONFLICT (match_pair_id) DO NOTHING`, [randomUUID(), pair.id, pair.meeting_area_id, connectionLifetimeSeconds]);
    await client.query("UPDATE match_pairs SET status='connection',updated_at=NOW() WHERE id=$1", [pair.id]);
    return getAffectedStates(client, session.id);
  });
}

export async function endConnection(sessionId: string, reason = "ended") {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, sessionId, true);
    if (!pair) return [{ sessionId, state: await canonicalState(client, sessionId) }];
    await client.query("UPDATE connections SET ended_at=COALESCE(ended_at,NOW()),end_reason=$2 WHERE match_pair_id=$1", [pair.id, reason]);
    await client.query("UPDATE match_pairs SET status='ended',updated_at=NOW() WHERE id=$1", [pair.id]);
    return [{ sessionId: pair.session_a_id, state: await canonicalState(client, pair.session_a_id) }, { sessionId: pair.session_b_id, state: await canonicalState(client, pair.session_b_id) }];
  });
}

export async function decideConnectionContinuation(session: ServerSession, wantsToContinue: boolean) {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, session.id, true);
    if (!pair || pair.status !== "time_up") throw new Error("The five-minute connection has not ended");
    const column = pair.session_a_id === session.id ? "a_continue" : "b_continue";
    if (!wantsToContinue) {
      const low = pair.session_a_id < pair.session_b_id ? pair.session_a_id : pair.session_b_id;
      const high = pair.session_a_id < pair.session_b_id ? pair.session_b_id : pair.session_a_id;
      await client.query("INSERT INTO pair_exclusions (session_low_id,session_high_id,reason,expires_at) VALUES ($1,$2,'pass',NOW()+INTERVAL '12 hours') ON CONFLICT (session_low_id,session_high_id) DO UPDATE SET reason=EXCLUDED.reason,expires_at=EXCLUDED.expires_at", [low, high]);
      await client.query("UPDATE connections SET ended_at=COALESCE(ended_at,NOW()),end_reason='finished' WHERE match_pair_id=$1", [pair.id]);
      await client.query("UPDATE match_pairs SET status='ended',updated_at=NOW() WHERE id=$1", [pair.id]);
    } else {
      await client.query(`UPDATE match_pairs SET ${column}=TRUE,updated_at=NOW() WHERE id=$1`, [pair.id]);
      const refreshed = await pairFor(client, session.id, true);
      if (refreshed?.a_continue && refreshed.b_continue) {
        await client.query("UPDATE match_pairs SET status='continuing',updated_at=NOW() WHERE id=$1", [pair.id]);
      }
    }
    return getAffectedStates(client, session.id);
  });
}

export async function leaveMatch(sessionId: string) {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, sessionId, true);
    if (pair) {
      await client.query("UPDATE connections SET ended_at=COALESCE(ended_at,NOW()),end_reason='left_match' WHERE match_pair_id=$1", [pair.id]);
      await client.query("UPDATE match_pairs SET status=$2,updated_at=NOW() WHERE id=$1", [pair.id, pair.connection_id && !pair.ended_at ? "ended" : "cancelled"]);
    }
    await client.query("UPDATE queue_entries SET status='cancelled' WHERE session_id=$1 AND status='waiting'", [sessionId]);
    return pair ? Promise.all([pair.session_a_id, pair.session_b_id].map(async (id) => ({ sessionId: id, state: await canonicalState(client, id) }))) : [{ sessionId, state: await canonicalState(client, sessionId) }];
  });
}

export async function expireRealtimeState() {
  return withTransaction(async (client) => {
    const expired = await client.query<{ session_a_id: string; session_b_id: string }>("UPDATE match_pairs SET status='expired',updated_at=NOW() WHERE status IN ('candidate','waiting_for_other') AND candidate_expires_at<=NOW() RETURNING session_a_id,session_b_id");
    const ended = await client.query<{ session_a_id: string; session_b_id: string }>(`UPDATE match_pairs p SET status='time_up',updated_at=NOW() FROM connections c WHERE c.match_pair_id=p.id AND p.status='connection' AND c.ends_at<=NOW() AND c.ended_at IS NULL RETURNING p.session_a_id,p.session_b_id`);
    const ids = [...expired.rows, ...ended.rows].flatMap((row) => [row.session_a_id, row.session_b_id]);
    return Promise.all([...new Set(ids)].map(async (sessionId) => ({ sessionId, state: await canonicalState(client, sessionId), kind: expired.rows.some((row) => row.session_a_id === sessionId || row.session_b_id === sessionId) ? "candidate" : "connection" as const })));
  });
}

export async function recordReport(reporterSessionId: string, reason: string) {
  return withTransaction(async (client) => {
    const pair = await pairFor(client, reporterSessionId);
    await client.query("INSERT INTO reports (id,reporter_session_id,match_pair_id,reason) VALUES ($1,$2,$3,$4)", [randomUUID(), reporterSessionId, pair?.id ?? null, reason]);
  });
}

export { meetingAreas };
