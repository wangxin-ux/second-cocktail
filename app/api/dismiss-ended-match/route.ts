import { NextResponse } from "next/server";
import { dismissEndedMatch } from "@/server/realtime/matchmaker";
import { getSessionForRequest } from "@/server/realtime/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Host",
};

export async function POST(request: Request) {
  try {
    const session = await getSessionForRequest(request);
    const body = await request.json() as { pairId?: unknown };
    if (!session || typeof body.pairId !== "string" || !body.pairId) {
      return NextResponse.json({ ok: false, error: "Invalid ended match" }, { status: 400, headers: noStoreHeaders });
    }
    return NextResponse.json({ ok: true, state: await dismissEndedMatch(session.id, body.pairId) }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to dismiss ended match" }, { status: 503, headers: noStoreHeaders });
  }
}
