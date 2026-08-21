"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { CocktailGenerationResponse } from "@/lib/cocktails/types";
import { generateBrowserCocktail } from "@/lib/cocktails/browser-generator";
import BartenderRecipe from "./bartender-recipe";
import CocktailReveal from "./cocktail-reveal";
import { profileSignature } from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";

type CocktailResultProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
};

function minimumMixingTime() {
  return new Promise((resolve) => window.setTimeout(resolve, 450));
}

function MixingState({
  spirit,
  flavor,
}: Pick<CocktailResultProps, "spirit" | "flavor">) {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#070707] px-6">
      <div
        aria-hidden="true"
        className="mixing-glow absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(202,186,155,0.09),transparent_68%)] blur-2xl"
      />
      <div className="relative z-10 text-center" role="status" aria-live="polite">
        <p className="mixing-copy text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/58">
          Mixing something unexpected
        </p>
        <p className="mt-4 text-[0.54rem] font-semibold uppercase tracking-[0.3em] text-white/20">
          {spirit.name} × {flavor.name}
        </p>
      </div>
    </main>
  );
}

export default function CocktailResult({
  spirit,
  flavor,
}: CocktailResultProps) {
  const requestStarted = useRef(false);
  const requestInFlight = useRef(false);
  const [result, setResult] = useState<CocktailGenerationResponse | null>(null);
  const [revealVersion, setRevealVersion] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const { profile, isHydrated: profileReady } = useSecondProfile();

  const generateCocktail = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setIsGenerating(true);
    setResult(null);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    window.scrollTo({ top: 0, behavior: "auto" });

    try {
      const [data] = await Promise.all([
        Promise.resolve().then(() =>
          generateBrowserCocktail({
            spirit: spirit.id,
            flavor: flavor.id,
            signatureSeed: profileSignature(profile),
            variation:
              window.crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          }),
        ),
        minimumMixingTime(),
      ]);

      setResult(data);
      setRevealVersion((version) => version + 1);
    } catch {
      setResult(
        generateBrowserCocktail({
          spirit: spirit.id,
          flavor: flavor.id,
          signatureSeed: profileSignature(profile),
          variation: "fallback",
        }),
      );
    } finally {
      requestInFlight.current = false;
      setIsGenerating(false);
    }
  }, [flavor.id, profile, spirit.id]);

  useEffect(() => {
    if (!profileReady || requestStarted.current) return;
    requestStarted.current = true;
    void generateCocktail();
  }, [generateCocktail, profileReady]);

  if (!result) return <MixingState spirit={spirit} flavor={flavor} />;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#070707]">
      <CocktailReveal
        key={revealVersion}
        cocktailName={result.recipe.name}
        generationMode={result.generationMode}
        spirit={spirit}
        flavor={flavor}
        profile={profile}
      />
      <BartenderRecipe
        recipe={result.recipe}
        isGenerating={isGenerating}
        onMakeAnother={() => void generateCocktail()}
        matchHref={`/match?${new URLSearchParams({
          spirit: spirit.id,
          flavor: flavor.id,
          cocktail: result.recipe.name,
        }).toString()}`}
      />
    </main>
  );
}
