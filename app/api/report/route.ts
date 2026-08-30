import { NextResponse } from "next/server";
import { recordReport } from "@/server/realtime/matchmaker";
import { getSessionForRequest } from "@/server/realtime/session";

const allowedReasons = new Set(["unsafe", "harassment", "impersonation", "other"]);
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSessionForRequest(request);
    const body: unknown = await request.json();
    const reason = typeof body === "object" && body !== null ? (body as { reason?: unknown }).reason : null;
    if (!session || typeof reason !== "string" || !allowedReasons.has(reason)) return NextResponse.json({ ok: false, error: "Invalid report" }, { status: 400 });
    await recordReport(session.id, reason);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to record report" }, { status: 503 });
  }
}
