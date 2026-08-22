"use client";

import { useState } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { GenerationMode } from "@/lib/cocktails/types";
import RevealBackground from "./reveal-background";
import { profileAura, type SecondProfile } from "@/lib/second/profile";
import { localizeFlavor, localizeSpirit, useI18n } from "@/lib/i18n";
import LanguageToggle from "../../language-toggle";

const atmosphereCopy = [
  "Made for tonight.",
  "Your night, distilled.",
  "Something unexpected.",
  "Born after dark.",
  "One night. One drink.",
  "Made for this moment.",
] as const;

type CocktailRevealProps = {
  cocktailName: string;
  generationMode: GenerationMode;
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
  profile: SecondProfile;
};

export default function CocktailReveal({
  cocktailName,
  generationMode,
  spirit,
  flavor,
  profile,
}: CocktailRevealProps) {
  const [caption] = useState(
    () => atmosphereCopy[Math.floor(Math.random() * atmosphereCopy.length)]!,
  );
  const aura = profileAura(profile);
  const { language, t } = useI18n();
  const localizedMode = generationMode === "fixed" ? t("fixedRecipe") : generationMode === "local" ? t("signature") : generationMode === "ai" ? t("aiSignature") : t("classic");

  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pb-[max(4.5rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))] sm:px-8">
      <RevealBackground flavor={flavor.id} />

      <div className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-20 sm:right-8">
        <LanguageToggle />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <p className="reveal-item reveal-mode text-[0.6rem] font-semibold uppercase tracking-[0.42em] text-white/48">
          {localizedMode}
        </p>

        <h1
          className="reveal-item reveal-name mx-auto mt-7 max-w-[11ch] text-balance text-[clamp(2.8rem,14vw,6.4rem)] font-medium uppercase leading-[0.88] tracking-[-0.065em] text-stone-100"
          data-testid="cocktail-name"
        >
          {cocktailName}
        </h1>

        <p className="reveal-item reveal-selection mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.27em] text-white/52">
          {localizeSpirit(spirit.id, spirit.name, language)} <span className="mx-1.5 text-white/22">×</span>{" "}
          {localizeFlavor(flavor.id, flavor.name, language)}
        </p>

        <p className="reveal-item reveal-caption mt-5 text-sm font-medium tracking-[-0.015em] text-white/36">
          {profile.nickname ? t("madeFor", { name: profile.nickname }) : language === "zh" ? "为这一刻而调。" : caption}
        </p>
        {aura.length > 0 ? (
          <p className="reveal-item reveal-caption mt-2 text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-white/24">
            {aura.join(" × ")}
          </p>
        ) : null}
      </div>

      <a
        href="#bartender-recipe"
        className="reveal-scroll-cue absolute bottom-[max(1.35rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex min-h-11 -translate-x-1/2 flex-col items-center justify-center gap-1 text-[0.5rem] font-semibold uppercase tracking-[0.28em] text-white/25 transition-colors hover:text-white/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {t("recipe")}
        <span aria-hidden="true" className="text-sm font-light">
          ↓
        </span>
      </a>
    </section>
  );
}
