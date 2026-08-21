"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpirit } from "../../spirits/spirits";
import { getFlavor } from "../flavors";
import CocktailResult from "./cocktail-result";

function RoutingState() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#070707] px-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
        Preparing your second
      </p>
    </main>
  );
}

function CocktailResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spiritId = searchParams.get("spirit") ?? undefined;
  const flavorId = searchParams.get("flavor") ?? undefined;
  const selectedSpirit = getSpirit(spiritId);
  const selectedFlavor = getFlavor(flavorId);

  useEffect(() => {
    if (!selectedSpirit) {
      router.replace("/spirits");
      return;
    }
    if (!selectedFlavor) {
      router.replace(`/flavors?spirit=${selectedSpirit.id}`);
    }
  }, [router, selectedFlavor, selectedSpirit]);

  if (!selectedSpirit || !selectedFlavor) return <RoutingState />;

  return (
    <CocktailResult
      spirit={selectedSpirit}
      flavor={selectedFlavor}
    />
  );
}

export default function CocktailResultPage() {
  return (
    <Suspense fallback={<RoutingState />}>
      <CocktailResultPageContent />
    </Suspense>
  );
}
