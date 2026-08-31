"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { CocktailGenerationResponse } from "@/lib/cocktails/types";
import { generateBrowserCocktail } from "@/lib/cocktails/browser-generator";
import { localizeCocktailRecipe } from "@/lib/cocktails/localize-recipe";
import BartenderRecipe from "./bartender-recipe";
import CocktailReveal from "./cocktail-reveal";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import { cocktailProfileSignature } from "@/lib/second/profile";
import {
  getTonightSeed,
  readTonightCocktailSession,
  writeTonightCocktailSession,
} from "@/lib/cocktails/tonight-session";
import { localizeFlavor, localizeSpirit, useI18n } from "@/lib/i18n";
import TonightSignal from "../../tonight-signal";

type CocktailResultProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
};

function minimumMixingTime() {
  return new Promise((resolve) => window.setTimeout(resolve, 1600));
}

function MixingState({
  spirit,
  flavor,
}: Pick<CocktailResultProps, "spirit" | "flavor">) {
  const { language } = useI18n();
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#070707] px-6">
      <div
        aria-hidden="true"
        className="mixing-glow absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(202,186,155,0.09),transparent_68%)] blur-2xl"
      />
      <div className="relative z-10 w-full max-w-xs" role="status" aria-live="polite">
        <p className="second-micro text-amber-100/58">{language === "zh" ? "今晚信号正在汇合" : "Tonight's signal is converging"}</p>
        <p className="mixing-copy mt-5 text-[2.15rem] font-medium leading-[.98] tracking-[-.055em] text-stone-100">
          {language === "zh" ? "正在把你的选择，调成一杯酒。" : "Turning your choices into one drink."}
        </p>
        <TonightSignal stage="mixing" spirit={spirit.id} flavor={flavor.id} label={language === "zh" ? "基酒与风味正在汇合成今晚信号" : "Spirit and flavor converging into tonight's signal"} className="mx-auto mt-4" />
        <p className="second-micro mt-8 text-white/42">
          {localizeSpirit(spirit.id, spirit.name, language)} × {localizeFlavor(flavor.id, flavor.name, language)}
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
  const { language } = useI18n();
  const { profile, isHydrated: profileReady } = useSecondProfile();
  const profileKey = cocktailProfileSignature(profile);

  const generateCocktail = useCallback(async (variation: number) => {
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
            energy: profile.energy,
            mbti: profile.mbti,
            signatureSeed: getTonightSeed(),
            variation,
          }),
        ),
        minimumMixingTime(),
      ]);

      setResult(data);
      writeTonightCocktailSession({
        spirit: spirit.id,
        flavor: flavor.id,
        profileKey,
        variation,
        result: data,
      });
      setRevealVersion((version) => version + 1);
    } catch {
      const fallback = generateBrowserCocktail({
        spirit: spirit.id,
        flavor: flavor.id,
        energy: profile.energy,
        mbti: profile.mbti,
        signatureSeed: getTonightSeed(),
        variation,
      });
      setResult(fallback);
      writeTonightCocktailSession({
        spirit: spirit.id,
        flavor: flavor.id,
        profileKey,
        variation,
        result: fallback,
      });
    } finally {
      requestInFlight.current = false;
      setIsGenerating(false);
    }
  }, [flavor.id, profile.energy, profile.mbti, profileKey, spirit.id]);

  useEffect(() => {
    if (!profileReady || requestStarted.current) return;
    requestStarted.current = true;
    const stored = readTonightCocktailSession();
    if (
      stored &&
      stored.spirit === spirit.id &&
      stored.flavor === flavor.id &&
      stored.profileKey === profileKey
    ) {
      queueMicrotask(() => {
        setResult(stored.result);
        setIsGenerating(false);
      });
      return;
    }
    queueMicrotask(() => void generateCocktail(0));
  }, [flavor.id, generateCocktail, profileKey, profileReady, spirit.id]);

  if (!result) return <MixingState spirit={spirit} flavor={flavor} />;

  const displayedRecipe = localizeCocktailRecipe(result.recipe, language);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#070707]">
      <CocktailReveal
        key={revealVersion}
        cocktailId={result.recipe.id}
        cocktailName={displayedRecipe.name}
        generationMode={result.generationMode}
        spirit={spirit}
        flavor={flavor}
        profile={profile}
        personalization={result.personalization}
      />
      <BartenderRecipe
        recipe={displayedRecipe}
        isGenerating={isGenerating}
        onMakeAnother={() => {
          const current = readTonightCocktailSession();
          const nextVariation =
            current?.spirit === spirit.id && current.flavor === flavor.id
              ? current.variation + 1
              : 1;
          void generateCocktail(nextVariation);
        }}
        matchHref={`/match?${new URLSearchParams({
          spirit: spirit.id,
          flavor: flavor.id,
          cocktail: displayedRecipe.name,
          cocktailId: result.recipe.id,
        }).toString()}`}
      />
    </main>
  );
}
