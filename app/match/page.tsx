"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFlavor } from "../flavors/flavors";
import { getSpirit } from "../spirits/spirits";
import MatchExperience from "./match-experience";

function RoutingState() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#070707] px-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
        Reading the room
      </p>
    </main>
  );
}

function MatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spiritId = searchParams.get("spirit") ?? undefined;
  const flavorId = searchParams.get("flavor") ?? undefined;
  const cocktail = searchParams.get("cocktail") ?? undefined;
  const spirit = getSpirit(spiritId);
  const flavor = getFlavor(flavorId);

  useEffect(() => {
    if (!spirit || !flavor) router.replace("/");
  }, [flavor, router, spirit]);

  if (!spirit || !flavor) return <RoutingState />;

  return (
    <MatchExperience
      spirit={spirit}
      flavor={flavor}
      cocktail={(cocktail ?? "Your Second Signature").slice(0, 80)}
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
