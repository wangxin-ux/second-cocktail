"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFlavor } from "../flavors/flavors";
import { getSpirit } from "../spirits/spirits";
import MatchExperience from "./match-experience";
import RealtimeMatchExperience from "./realtime-match-experience";
import { useI18n } from "@/lib/i18n";
import type { DemoMatchScenario } from "@/lib/second/demo-match-service";

function RoutingState() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#070707] px-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
        {t("room")}
      </p>
    </main>
  );
}

function MatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spiritId = searchParams.get("spirit") ?? undefined;
  const flavorId = searchParams.get("flavor") ?? undefined;
  const demoParam = searchParams.get("demo");
  const scenario: DemoMatchScenario = demoParam === "empty" || demoParam === "error" ? demoParam : "default";
  const spirit = getSpirit(spiritId);
  const flavor = getFlavor(flavorId);

  useEffect(() => {
    if (!spirit || !flavor) router.replace("/");
  }, [flavor, router, spirit]);

  if (!spirit || !flavor) return <RoutingState />;
  const mode = process.env.NEXT_PUBLIC_MATCH_MODE === "demo" ? "demo" : "realtime";

  return mode === "realtime" ? <RealtimeMatchExperience spirit={spirit} flavor={flavor} /> : (
    <MatchExperience
      spirit={spirit}
      flavor={flavor}
      scenario={scenario}
    />
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<RoutingState />}>
      <MatchPageContent />
    </Suspense>
  );
}
