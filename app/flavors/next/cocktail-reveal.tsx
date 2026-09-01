"use client";

import { useState } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { CocktailGenerationResponse, GenerationMode } from "@/lib/cocktails/types";
import RevealBackground from "./reveal-background";
import { profileAura, type SecondProfile } from "@/lib/second/profile";
import { localizeFlavor, localizeSpirit, useI18n } from "@/lib/i18n";
import LanguageToggle from "../../language-toggle";
import CocktailTarotCard from "./cocktail-tarot-card";

const atmosphereCopy = [
  "Made for tonight.",
  "Your night, distilled.",
  "Something unexpected.",
  "Born after dark.",
  "One night. One drink.",
  "Made for this moment.",
] as const;

type CocktailRevealProps = {
  cocktailId: string;
  cocktailName: string;
  generationMode: GenerationMode;
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
  profile: SecondProfile;
  personalization: CocktailGenerationResponse["personalization"];
};

function whyThisDrink(
  flavor: FlavorId,
  personalization: CocktailGenerationResponse["personalization"],
  language: "en" | "zh",
) {
  const flavorLines = {
    sour: { en: "You chose sour, so the structure stays bright and precise.", zh: "你选了酸，所以它保持明亮而利落。" },
    sweet: { en: "You chose sweet, so the structure stays rounded and generous.", zh: "你选了甜，所以它保留圆润和丰盛感。" },
    bitter: { en: "You chose bitter, so the drink keeps more depth and length.", zh: "你选了苦，所以它保留更深的层次与余韵。" },
    fruity: { en: "You chose fruity, so the drink opens with a vivid aroma.", zh: "你选了果香，所以它从鲜活的香气开始。" },
    refreshing: { en: "You chose refreshing, so the drink stays bright and clean.", zh: "你选了清爽，所以它保持明亮轻盈。" },
    bold: { en: "You chose bold, so the base spirit stays firmly in view.", zh: "你选了浓烈，所以基酒依然站在最前面。" },
  } as const;
  const energyLines = {
    open: { en: "Tonight feels open, so it was given a little more lift.", zh: "今晚愿意打开自己，所以 second 给它多一点轻盈感。" },
    curious: { en: "Your curious energy left room for one less predictable detail.", zh: "今晚偏好奇，所以 second 给它留了一点意外。" },
    slow: { en: "Tonight is unhurried, so the structure was softened and simplified.", zh: "今晚想慢一点，所以 second 让结构更柔和克制。" },
    celebrating: { en: "Tonight is a celebration, so the finish was made more lifted.", zh: "今晚值得庆祝，所以 second 让收尾更明亮活跃。" },
  } as const;

  const lines: string[] = [flavorLines[flavor][language]];
  if (personalization.energy) {
    lines.push(energyLines[personalization.energy][language]);
  } else if (personalization.mbti) {
    lines.push(
      language === "zh"
        ? "你的个人节奏只做了一次轻微调整，没有改变这杯酒的基本方向。"
        : "Your personal rhythm made one light refinement without changing the drink's direction.",
    );
  }
  return lines;
}

export default function CocktailReveal({
  cocktailId,
  cocktailName,
  generationMode,
  spirit,
  flavor,
  profile,
  personalization,
}: CocktailRevealProps) {
  const [caption] = useState(
    () => atmosphereCopy[Math.floor(Math.random() * atmosphereCopy.length)]!,
  );
  const aura = profileAura(profile);
  const { language, t } = useI18n();
  const localizedMode = generationMode === "fixed" ? t("fixedRecipe") : generationMode === "local" ? t("signature") : generationMode === "ai" ? t("aiSignature") : t("classic");
  const explanation = whyThisDrink(flavor.id, personalization, language);
  const localizedAura = language === "zh"
    ? aura.map((item) => ({ Introspective: "内敛", Magnetic: "有吸引力", Fire: "火象", Earth: "土象", Air: "风象", Water: "水象", Open: "开放", Curious: "好奇", Unhurried: "从容", Electric: "热烈" }[item] ?? item))
    : aura;

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))] sm:px-8 sm:pt-24">
      <RevealBackground flavor={flavor.id} />

      <div className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-20 sm:right-8">
        <LanguageToggle />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col">
        <p className="reveal-item reveal-mode text-[0.6rem] font-semibold uppercase tracking-[0.42em] text-white/48">
          {localizedMode}
        </p>

        <h1
          className="reveal-item reveal-name second-title mt-7 max-w-[10ch] uppercase text-stone-100"
          data-testid="cocktail-name"
        >
          {cocktailName}
        </h1>

        <div className="reveal-item reveal-tarot mt-10 flex w-full justify-end pr-2 sm:mt-12 sm:pr-[10%]">
          <CocktailTarotCard
            cocktailId={cocktailId}
            cocktailName={cocktailName}
            spirit={spirit.id}
            flavor={flavor.id}
            profile={profile}
            language={language}
          />
        </div>

        <p className="reveal-item reveal-selection second-micro mt-9 text-white/58">
          {localizeSpirit(spirit.id, spirit.name, language)} <span className="mx-1.5 text-white/22">×</span>{" "}
          {localizeFlavor(flavor.id, flavor.name, language)}
        </p>

        <p className="reveal-item reveal-caption mt-5 font-[family-name:var(--font-display)] text-xl italic text-white/56">
          {profile.nickname ? t("madeFor", { name: profile.nickname }) : language === "zh" ? "为这一刻而调。" : caption}
        </p>
        {aura.length > 0 ? (
          <p className="reveal-item reveal-caption second-micro mt-2 text-white/38">
            {localizedAura.join(" × ")}
          </p>
        ) : null}

        <section className="reveal-item reveal-caption second-rule mt-10 ml-[9%] w-[91%] max-w-md pt-6 text-left">
          <p className="second-micro text-amber-100/58">
            {t("whyDrink")}
          </p>
          <p className="mt-4 text-[1.05rem] font-medium leading-[1.55] tracking-[-0.02em] text-white/72">
            {explanation.join(" ")}
          </p>
        </section>

        <a
          href="#bartender-recipe"
          className="reveal-item reveal-scroll-cue mt-10 inline-flex w-fit flex-col items-center gap-1 self-center text-center text-[0.61rem] font-semibold leading-5 tracking-[0.12em] text-white/48 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span aria-hidden="true" className="text-lg font-light leading-none">↓</span>
          <span>{language === "zh" ? "往下滑" : "Scroll down"}</span>
          <span className="font-normal tracking-normal text-white/36">{language === "zh" ? "把你的专属酒单给调酒师" : "Show your bartender the recipe"}</span>
        </a>
      </div>
    </section>
  );
}
