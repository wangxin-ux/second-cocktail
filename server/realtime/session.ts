import type { PoolClient } from "pg";
import { db } from "@/server/db/client";
import { createRawSessionToken, hashToken, randomUUID, type TonightSignals } from "./validation";
import { resolveVenueIdFromRequest } from "./venue";

export const tonightCookieName = "second_tonight";
export const tonightSessionLifetimeMs = 30 * 60 * 1000;

export type ServerSession = TonightSignals & { id: string; venueId: string; invalidatedAt: string | null };

export function parseCookie(cookieHeader: string | undefined, name = tonightCookieName) {
  if (!cookieHeader) return null;
  const value = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export async function getSessionByToken(token: string | null, client: Pick<PoolClient, "query"> | typeof db = db) {
  if (!token) return null;
  return querySession(client, hashToken(token));
}

async function querySession(client: Pick<PoolClient, "query"> | typeof db, tokenHash: string): Promise<ServerSession | null> {
  const result = await client.query<{
    id: string; nickname: string; age: number; age_band: number; energy: TonightSignals["energy"]; mbti: TonightSignals["mbti"] | null;
    spirit: TonightSignals["spirit"]; flavor: TonightSignals["flavor"]; cocktail_id: string; cocktail_name: string; venue_id: string; invalidated_at: string | null;
  }>(`SELECT id, nickname, age, age_band, energy, mbti, spirit, flavor, cocktail_id, cocktail_name, venue_id, invalidated_at
      FROM tonight_sessions WHERE token_hash = $1 AND invalidated_at IS NULL AND expires_at > NOW()`, [tokenHash]);
  const row = result.rows[0];
  return row ? { id: row.id, venueId: row.venue_id, nickname: row.nickname, age: row.age, ageBand: row.age_band, energy: row.energy, ...(row.mbti ? { mbti: row.mbti } : {}), spirit: row.spirit, flavor: row.flavor, cocktailId: row.cocktail_id, cocktailName: row.cocktail_name, invalidatedAt: row.invalidated_at } : null;
}

export async function getSessionForRequest(request: Request) {
  const venueId = resolveVenueIdFromRequest(request);
  if (!venueId) return null;
  const session = await getSessionByToken(parseCookie(request.headers.get("cookie") ?? undefined));
  return session?.venueId === venueId ? session : null;
}

export async function createOrRefreshSession(signals: TonightSignals, existingToken: string | null, venueId: string) {
  const existing = await getSessionByToken(existingToken);
  const expiresAt = new Date(Date.now() + tonightSessionLifetimeMs);
  if (existing && existingToken && existing.venueId === venueId) {
    await db.query(`UPDATE tonight_sessions SET nickname=$2, age=$3, age_band=$4, energy=$5, mbti=$6, spirit=$7, flavor=$8,
      cocktail_id=$9, cocktail_name=$10, last_seen_at=NOW(), expires_at=$11 WHERE id=$1`,
      [existing.id, signals.nickname, signals.age, signals.ageBand, signals.energy, signals.mbti ?? null, signals.spirit, signals.flavor, signals.cocktailId, signals.cocktailName, expiresAt]);
    return { token: existingToken, session: { ...signals, id: existing.id, venueId, invalidatedAt: null } satisfies ServerSession };
  }
  const token = createRawSessionToken();
  const id = randomUUID();
  await db.query(`INSERT INTO tonight_sessions (id, token_hash, nickname, age, age_band, energy, mbti, spirit, flavor, cocktail_id, cocktail_name, venue_id, expires_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, hashToken(token), signals.nickname, signals.age, signals.ageBand, signals.energy, signals.mbti ?? null, signals.spirit, signals.flavor, signals.cocktailId, signals.cocktailName, venueId, expiresAt]);
  return { token, session: { ...signals, id, venueId, invalidatedAt: null } satisfies ServerSession };
}

export async function touchSession(sessionId: string) {
  await db.query(
    `WITH touched_session AS (
       UPDATE tonight_sessions SET last_seen_at = NOW() WHERE id = $1 AND invalidated_at IS NULL RETURNING id
     )
     UPDATE queue_entries SET last_seen_at = NOW()
     WHERE session_id IN (SELECT id FROM touched_session) AND status = 'waiting'`,
    [sessionId],
  );
}

export async function invalidateSession(sessionId: string) {
  await db.query("UPDATE tonight_sessions SET invalidated_at = NOW() WHERE id = $1", [sessionId]);
}
