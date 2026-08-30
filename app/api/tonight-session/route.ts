import { NextResponse } from "next/server";
import { createOrRefreshSession, parseCookie, tonightCookieName, tonightSessionLifetimeMs } from "@/server/realtime/session";
import { validateTonightSignals } from "@/server/realtime/validation";
import { resolveVenueIdFromRequest } from "@/server/realtime/venue";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const signals = validateTonightSignals(await request.json());
    const venueId = resolveVenueIdFromRequest(request);
    if (!signals || !venueId) return NextResponse.json({ ok: false, error: "Invalid tonight signals" }, { status: 400 });
    const result = await createOrRefreshSession(signals, parseCookie(request.headers.get("cookie") ?? undefined), venueId);
    const response = NextResponse.json({ ok: true, expiresAt: new Date(Date.now() + tonightSessionLifetimeMs).toISOString() });
    response.cookies.set(tonightCookieName, result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: tonightSessionLifetimeMs / 1000 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid tonight signals" }, { status: 400 });
  }
}
