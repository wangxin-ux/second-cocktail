import { NextResponse } from "next/server";
import { getCanonicalState } from "@/server/realtime/matchmaker";
import { getSessionForRequest } from "@/server/realtime/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Host",
};

export async function GET(request: Request) {
  try {
    const session = await getSessionForRequest(request);
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401, headers: noStoreHeaders });
    return NextResponse.json({
      ok: true,
      state: await getCanonicalState(session.id),
      resume: { spirit: session.spirit, flavor: session.flavor },
    }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ ok: false, error: "Match state unavailable" }, { status: 503, headers: noStoreHeaders });
  }
}
