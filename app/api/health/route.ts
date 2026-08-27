import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.query("SELECT 1");
    return NextResponse.json({ status: "ok", service: "next" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", service: "next" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
