import { headers } from "next/headers";
import HomeClient from "./home-client";
import { getFlavor } from "./flavors/flavors";
import RealtimeMatchExperience from "./match/realtime-match-experience";
import { getSpirit } from "./spirits/spirits";
import { getCanonicalState } from "@/server/realtime/matchmaker";
import { getSessionByToken, parseCookie } from "@/server/realtime/session";
import { resolveVenueIdFromHost } from "@/server/realtime/venue";

export const dynamic = "force-dynamic";

const resumableStages = new Set([
  "waiting",
  "candidate",
  "waiting_for_other",
  "mutual",
  "connection",
  "time_up",
  "waiting_for_continue",
  "continuing",
]);

async function getHomeContext() {
  try {
    const requestHeaders = await headers();
    const venueId = resolveVenueIdFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    );
    const session = await getSessionByToken(
      parseCookie(requestHeaders.get("cookie") ?? undefined),
    );
    if (!session || !venueId || session.venueId !== venueId) return { venueId, selection: null };

    const state = await getCanonicalState(session.id);
    if (!resumableStages.has(state.stage)) return { venueId, selection: null };

    const spirit = getSpirit(session.spirit);
    const flavor = getFlavor(session.flavor);
    return { venueId, selection: spirit && flavor ? { spirit, flavor } : null };
  } catch {
    return { venueId: null, selection: null };
  }
}

export default async function HomePage() {
  const { venueId, selection } = await getHomeContext();
  const directMatch = venueId === "main";
  if (selection) return <RealtimeMatchExperience {...selection} directMatch={directMatch} />;
  return <HomeClient directMatch={directMatch} />;
}
