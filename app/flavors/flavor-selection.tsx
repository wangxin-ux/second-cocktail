"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Spirit } from "../spirits/spirits";
import { flavors, type FlavorId } from "./flavors";
import LanguageToggle from "../language-toggle";
import { localizeFlavor, localizeFlavorDescription, localizeSpirit, useI18n } from "@/lib/i18n";
import TonightSignal from "../tonight-signal";

type FlavorSelectionProps = {
  spirit: Pick<Spirit, "id" | "name">;
};

export default function FlavorSelection({ spirit }: FlavorSelectionProps) {
  const router = useRouter();
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorId | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { language, t } = useI18n();

  function generateCocktail() {
    if (!selectedFlavor || isNavigating) return;
    setIsNavigating(true);
    router.push(`/flavors/next?spirit=${spirit.id}&flavor=${selectedFlavor}`);
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden px-5 pb-4 pt-5 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-indigo-200/[0.035] blur-3xl"
      />

      <div className="second-shell relative flex min-h-[calc(100dvh-2.25rem)] flex-col">
        <header className="flex min-h-10 items-center justify-between">
          <Link
            href="/spirits"
            className="group inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span
              aria-hidden="true"
              className="text-base transition-transform duration-200 group-hover:-translate-x-0.5"
            >
              ←
            </span>
            {t("back")}
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">
              {t("flavorStep")}
            </span>
          </div>
        </header>

        <section className="pb-5 pt-6">
          <h1 className="second-screen-title max-w-xs text-stone-100">
            {t("craving")}
          </h1>
          <p className="second-body mt-4">
            {t("flavorBody")}
          </p>

          <div className="mt-4 flex items-center gap-2.5" aria-label={`${t("base")} ${localizeSpirit(spirit.id, spirit.name, language)}`}>
            <span className="text-[0.57rem] font-semibold uppercase tracking-[0.24em] text-white/25">
              {t("base")}
            </span>
            <span className="h-px w-5 bg-white/10" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/48">
              {localizeSpirit(spirit.id, spirit.name, language)}
            </span>
          </div>
          <TonightSignal
            stage="flavor"
            spirit={spirit.id}
            flavor={selectedFlavor}
            label={language === "zh" ? "风味正在改变今晚信号的感官方向" : "Flavor is changing the sensory direction of tonight's signal"}
            className="mx-auto -mb-4 mt-1 max-w-[13rem]"
          />
        </section>

        <div
          aria-label={t("craving")}
          className="grid grid-cols-2 gap-x-5 border-t border-white/[0.12]"
          role="radiogroup"
        >
          {flavors.map((flavor, index) => {
            const isSelected = selectedFlavor === flavor.id;

            return (
              <button
                key={flavor.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedFlavor(flavor.id)}
                className={`second-focus group relative min-h-[6.7rem] overflow-hidden border-b border-x-0 border-t-0 px-1 py-4 text-left transition-all duration-200 ease-out active:scale-[0.99] ${
                  isSelected
                    ? "border-amber-100/55 bg-transparent"
                    : "border-white/[0.12] bg-transparent hover:border-white/25"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-0 h-px bg-amber-100 transition-[width] duration-300 ${isSelected ? "w-full" : "w-0"}`}
                />

                <span className="relative flex h-full min-h-[4.7rem] flex-col justify-between">
                  <span className="flex items-start justify-between">
                    <span
                      className={`text-[0.55rem] font-semibold tabular-nums tracking-[0.18em] transition-colors ${
                        isSelected ? "text-white/65" : "text-white/20"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full bg-white transition-all duration-200 ${
                        isSelected
                          ? "scale-100 opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                          : "scale-50 opacity-0"
                      }`}
                    />
                  </span>

                  <span>
                    <span
                      className={`block text-base font-medium tracking-[-0.025em] transition-colors ${
                        isSelected ? "text-white" : "text-white/78"
                      }`}
                    >
                      {localizeFlavor(flavor.id, flavor.name, language)}
                    </span>
                    <span
                      className={`mt-1 block text-[0.65rem] leading-tight tracking-[0.025em] transition-colors ${
                        isSelected ? "text-white/62" : "text-white/30"
                      }`}
                    >
                      {localizeFlavorDescription(flavor.id, flavor.description, language)}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
          <button
            type="button"
            disabled={!selectedFlavor || isNavigating}
            onClick={generateCocktail}
            className="second-primary"
          >
          {isNavigating ? t("preparing") : t("generate")}
          </button>
        </div>
      </div>
    </main>
  );
}
