import { headers } from "next/headers";
import HomeClient from "../home-client";
import { getFlavor } from "../flavors/flavors";
import { getSpirit } from "../spirits/spirits";
import MatchExperience from "./match-experience";
import RealtimeMatchExperience from "./realtime-match-experience";
import type { DemoMatchScenario } from "@/lib/second/demo-match-service";
import { getSessionByToken, parseCookie } from "@/server/realtime/session";
import { resolveVenueIdFromHost } from "@/server/realtime/venue";

export const dynamic = "force-dynamic";

type MatchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MatchPage({ searchParams }: MatchPageProps) {
  const params = await searchParams;
  let spirit = getSpirit(first(params.spirit));
  let flavor = getFlavor(first(params.flavor));
  let venueId: string | null = null;

  try {
    const requestHeaders = await headers();
    venueId = resolveVenueIdFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    );
    if (!spirit || !flavor) {
      const session = await getSessionByToken(
        parseCookie(requestHeaders.get("cookie") ?? undefined),
      );
      if (session && venueId && session.venueId === venueId) {
        spirit = getSpirit(session.spirit);
        flavor = getFlavor(session.flavor);
      }
    }
  } catch {
    // The stable fallback below remains usable if persistence is unavailable.
  }

  const directMatch = venueId === "main";
  if (directMatch) {
    spirit ??= getSpirit("gin");
    flavor ??= getFlavor("refreshing");
  }

  if (!spirit || !flavor) return <HomeClient directMatch={directMatch} />;

  const demoParam = first(params.demo);
  const scenario: DemoMatchScenario = demoParam === "empty" || demoParam === "error" ? demoParam : "default";
  const mode = process.env.NEXT_PUBLIC_MATCH_MODE === "demo" ? "demo" : "realtime";

  return mode === "realtime" ? (
    <RealtimeMatchExperience spirit={spirit} flavor={flavor} directMatch={directMatch} />
  ) : (
    <MatchExperience spirit={spirit} flavor={flavor} scenario={scenario} />
  );
}
