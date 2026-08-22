"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FlavorId } from "../flavors/flavors";
import type { SpiritId } from "../spirits/spirits";
import { findTonightMatch } from "@/lib/second/match";
import {
  completedProfileFields,
} from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import LanguageToggle from "../language-toggle";
import { localizeFlavor, localizeMatchCandidate, localizeMatchReason, localizeSpirit, useI18n } from "@/lib/i18n";

type MatchExperienceProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
  cocktail: string;
};

export default function MatchExperience({
  spirit,
  flavor,
  cocktail,
}: MatchExperienceProps) {
  const { profile, isHydrated: isReady } = useSecondProfile();
  const { language, t } = useI18n();
  const [hasConsented, setHasConsented] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const match = useMemo(
    () => findTonightMatch(profile, spirit.id, flavor.id),
    [flavor.id, profile, spirit.id],
  );

  if (!isReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#070707] px-6">
        <p className="mixing-copy text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
          {t("room")}
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#080808] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(176,139,101,0.11),transparent_68%)] blur-2xl"
      />
      <div className="relative mx-auto w-full max-w-md">
        <header className="flex min-h-11 items-center justify-between">
          <Link
            href={`/flavors/next?spirit=${spirit.id}&flavor=${flavor.id}`}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/42 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span aria-hidden="true">←</span>
            {t("drink")}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/50">
              {t("matchLabel")}
            </span>
          </div>
        </header>

        {!isRevealed ? (
          <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center pb-8 pt-8">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-white/28">
              {t("matchIntroEyebrow")}
            </p>
            <h1 className="mt-4 text-[2.65rem] font-medium leading-[0.94] tracking-[-0.065em] text-stone-100">
              {t("matchIntroTitle")}
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/42">
              {t("matchIntroBody", { cocktail })}
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.56rem] font-semibold uppercase tracking-[0.27em] text-white/28">
                    {t("matchSignals")}
                  </p>
                  <p className="mt-2 text-sm text-white/65">
                    {t("fieldsAndDrink", { count: completedProfileFields(profile), spirit: localizeSpirit(spirit.id, spirit.name, language), flavor: localizeFlavor(flavor.id, flavor.name, language) })}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="shrink-0 text-xs font-semibold text-amber-100/55 underline decoration-white/15 underline-offset-4"
                >
                  {t("edit")}
                </Link>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] p-4">
              <input
                checked={hasConsented}
                className="mt-0.5 h-4 w-4 accent-[#eadfce]"
                type="checkbox"
                onChange={(event) => setHasConsented(event.target.checked)}
              />
              <span className="text-xs leading-5 text-white/42">
                {t("consent")}
              </span>
            </label>

            <button
              type="button"
              disabled={!hasConsented}
              onClick={() => setIsRevealed(true)}
              className="mt-5 min-h-14 w-full rounded-full bg-stone-100 px-6 text-sm font-semibold text-neutral-950 transition-all enabled:hover:bg-white enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/[0.07] disabled:text-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {t("readRoom")}
            </button>

            <p className="mt-4 text-center text-[0.57rem] uppercase tracking-[0.19em] text-white/20">
              {t("demoPool")}
            </p>
          </section>
        ) : (
          <section className="match-reveal flex min-h-[calc(100svh-5rem)] flex-col justify-center pb-8 pt-10">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/48">
              {t("meet")}
            </p>
            <h1 className="mt-5 text-[4.6rem] font-medium uppercase leading-[0.82] tracking-[-0.075em] text-stone-100">
              {match.candidate.nickname}
            </h1>
            <p className="mt-6 text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-white/36">
              {match.candidate.mbti} × {match.candidate.zodiac} × {match.candidate.drink}
            </p>

            <div className="mt-9 border-y border-white/[0.08] py-6">
              <p className="text-base leading-7 tracking-[-0.02em] text-white/72">
                {localizeMatchCandidate(match.candidate.id, match.candidate.oneLine, language, "oneLine")}
              </p>
              <div className="mt-6">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-white/28">
                  {t("whyTonight")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/48">
                  {match.reasons.length > 0
                    ? t("shared", { reasons: match.reasons.map((reason) => localizeMatchReason(reason, language)).join(language === "zh" ? "、" : " and ") })
                    : t("different")}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-[1.5rem] border border-amber-100/[0.12] bg-amber-100/[0.035] p-5">
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-amber-100/42">
                {t("openingLine")}
              </p>
              <p className="mt-3 text-base leading-6 text-stone-100/80">
                “{localizeMatchCandidate(match.candidate.id, match.candidate.opener, language, "opener")}”
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRevealed(false)}
              className="mt-7 min-h-13 w-full rounded-full border border-white/[0.1] px-6 text-sm font-semibold text-white/55 transition-colors hover:border-white/25 hover:text-white/85"
            >
              {t("backMatch")}
            </button>
            <p className="mt-4 text-center text-[0.57rem] uppercase tracking-[0.18em] text-white/18">
              {t("fictional")}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
