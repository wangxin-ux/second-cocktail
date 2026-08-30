import { NextResponse } from "next/server";
import { endConnection, leaveMatch } from "@/server/realtime/matchmaker";
import { getSessionForRequest, invalidateSession, tonightCookieName } from "@/server/realtime/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSessionForRequest(request);
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    await endConnection(session.id, "end_tonight");
    await leaveMatch(session.id);
    await invalidateSession(session.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(tonightCookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to end tonight" }, { status: 503 });
  }
}
