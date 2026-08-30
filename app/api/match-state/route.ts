import { NextResponse } from "next/server";
import { getCanonicalState } from "@/server/realtime/matchmaker";
import { getSessionForRequest } from "@/server/realtime/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getSessionForRequest(request);
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    return NextResponse.json({ ok: true, state: await getCanonicalState(session.id) });
  } catch {
    return NextResponse.json({ ok: false, error: "Match state unavailable" }, { status: 503 });
  }
}
