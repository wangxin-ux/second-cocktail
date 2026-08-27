"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spirits, type SpiritId } from "./spirits";
import LanguageToggle from "../language-toggle";
import { localizeSpirit, localizeSpiritProfile, useI18n } from "@/lib/i18n";
import TonightSignal from "../tonight-signal";

export default function SpiritSelectionPage() {
  const router = useRouter();
  const [selectedSpirit, setSelectedSpirit] = useState<SpiritId | null>(null);
  const { language, t } = useI18n();

  function continueToNextStep() {
    if (!selectedSpirit) return;
    router.push(`/flavors?spirit=${selectedSpirit}`);
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden px-5 pb-4 pt-5 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-24 h-72 w-72 rounded-full bg-amber-100/[0.045] blur-3xl"
      />

      <div className="second-shell relative flex min-h-[calc(100dvh-2.25rem)] flex-col">
        <header className="flex min-h-10 items-center justify-between">
          <Link
            href="/profile"
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
              {t("spiritStep")}
            </span>
          </div>
        </header>

        <section className="pb-5 pt-6">
          <p className="second-micro mb-3 text-amber-100/58">
            {t("baseSpirit")}
          </p>
          <h1 className="second-screen-title text-stone-100">
            {t("chooseSpirit")}
          </h1>
          <p className="second-body mt-4">
            {t("spiritBody")}
          </p>
          <TonightSignal
            stage="spirit"
            spirit={selectedSpirit}
            label={language === "zh" ? "基酒正在改变今晚信号的骨架" : "The spirit is shaping the backbone of tonight's signal"}
            className="mx-auto -mb-3 mt-1 max-w-[13.5rem]"
          />
        </section>

        <div
          aria-label={t("baseSpirit")}
          className="grid border-t border-white/[0.12]"
          role="radiogroup"
        >
          {spirits.map((spirit, index) => {
            const isSelected = selectedSpirit === spirit.id;

            return (
              <button
                key={spirit.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedSpirit(spirit.id)}
                className={`second-focus group relative flex min-h-[4.5rem] w-full items-center overflow-hidden border-b border-x-0 border-t-0 px-1 py-3 text-left transition-all duration-200 ease-out ${
                  isSelected
                    ? "border-amber-100/35 bg-gradient-to-r from-amber-100/[0.09] to-transparent"
                    : "border-white/[0.12] bg-transparent hover:bg-white/[0.035]"
                }`}
              >
                <span
                  className={`mr-4 text-[0.58rem] font-semibold tabular-nums tracking-[0.18em] transition-colors ${
                    isSelected ? "text-amber-100/70" : "text-white/20"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <span
                    className={`text-[1.1rem] font-medium tracking-[-0.035em] transition-colors ${
                      isSelected ? "text-white" : "text-white/78"
                    }`}
                  >
                    {localizeSpirit(spirit.id, spirit.name, language)}
                  </span>
                  <span
                    className={`shrink-0 text-[0.69rem] tracking-[0.04em] transition-colors ${
                      isSelected ? "text-amber-50/70" : "text-white/30"
                    }`}
                  >
                    {localizeSpiritProfile(spirit.id, spirit.profile, language)}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={`absolute right-0 top-1/2 h-9 w-px -translate-y-1/2 bg-amber-100 transition-all duration-200 ${
                    isSelected ? "opacity-70" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
          <button
            type="button"
            disabled={!selectedSpirit}
            onClick={continueToNextStep}
            className="second-primary"
          >
            {t("continue")}
          </button>
        </div>
      </div>
    </main>
  );
}
