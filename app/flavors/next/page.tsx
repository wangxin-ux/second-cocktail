"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpirit } from "../../spirits/spirits";
import { getFlavor } from "../flavors";
import CocktailResult from "./cocktail-result";
import { useI18n } from "@/lib/i18n";

function RoutingState() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#070707] px-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
        {t("preparingSecond")}
      </p>
    </main>
  );
}

function CocktailResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spiritId = searchParams.get("spirit") ?? undefined;
  const flavorId = searchParams.get("flavor") ?? undefined;
  const variantIndex = Number(searchParams.get("variant") ?? "1");
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

  if (!selectedSpirit || !selectedFlavor || !Number.isInteger(variantIndex) || variantIndex < 1 || variantIndex > 3) return <RoutingState />;

  return (
    <CocktailResult
      spirit={selectedSpirit}
      flavor={selectedFlavor}
      variantIndex={variantIndex}
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
