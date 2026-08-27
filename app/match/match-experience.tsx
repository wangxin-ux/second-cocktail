"use client";

import Link from "next/link";
import type { FlavorId } from "../flavors/flavors";
import type { SpiritId } from "../spirits/spirits";
import { completedProfileFields } from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import LanguageToggle from "../language-toggle";
import { localizeFlavor, localizeSpirit, useI18n } from "@/lib/i18n";

type MatchExperienceProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
  cocktail: string;
};

export default function MatchExperience({ spirit, flavor, cocktail }: MatchExperienceProps) {
  const { profile, isHydrated } = useSecondProfile();
  const { language, t } = useI18n();
  const eligible = Boolean(profile.nickname && profile.age && profile.heightCm && profile.meetingLocation);

  if (!isHydrated) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#070707] px-6"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">{t("room")}</p></main>;
  }

  return <main className="relative min-h-dvh overflow-hidden bg-[#080808] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-stone-100 sm:px-6">
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(190,154,112,0.12),transparent_68%)] blur-3xl" />
    <div className="relative mx-auto w-full max-w-md">
      <header className="flex min-h-11 items-center justify-between">
        <Link href={`/flavors/next?spirit=${spirit.id}&flavor=${flavor.id}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/42"><span aria-hidden="true">←</span>{t("drink")}</Link>
        <div className="flex items-center gap-3"><LanguageToggle /><span className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/50">{t("matchLabel")}</span></div>
      </header>

      <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center pb-8 pt-8">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/50">{t("matchIntroEyebrow")}</p>
        <h1 className="mt-4 text-[3.15rem] font-medium leading-[0.9] tracking-[-0.075em]">{t("matchIntroTitle")}</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-white/48">{language === "zh" ? `我们会用你的档案与「${cocktail}」的情绪，为你寻找今晚此刻也在现场的人。` : `We’ll use your profile and the mood of “${cocktail}” to find someone who is here tonight.`}</p>

        <div className="mt-9 rounded-[1.65rem] border border-white/[0.09] bg-white/[0.025] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.56rem] font-semibold uppercase tracking-[0.27em] text-white/30">{t("matchSignals")}</p>
              <p className="mt-2 text-sm leading-6 text-white/68">{t("fieldsAndDrink", { count: completedProfileFields(profile), spirit: localizeSpirit(spirit.id, spirit.name, language), flavor: localizeFlavor(flavor.id, flavor.name, language) })}</p>
            </div>
            <Link href="/profile" className="shrink-0 text-xs font-semibold text-amber-100/60 underline decoration-white/15 underline-offset-4">{t("edit")}</Link>
          </div>
          <div className="mt-5 border-t border-white/[0.08] pt-5">
            <p className="text-xs leading-5 text-white/38">{language === "zh" ? "匹配成功后会先展示双方的昵称、年龄和身高；你同意后才会开始五分钟并显示见面位置。" : "A match first reveals names, ages and heights. The five minutes and meeting location begin only after acceptance."}</p>
          </div>
        </div>

        {eligible ? <Link href="/social-talk" className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-stone-100 px-6 text-sm font-semibold text-neutral-950 transition-all hover:bg-white active:scale-[0.99]">{t("readRoom")}</Link> : <Link href="/profile" className="mt-6 flex min-h-14 w-full items-center justify-center rounded-full bg-stone-100 px-6 text-sm font-semibold text-neutral-950">{language === "zh" ? "补全见面信息" : "Complete meeting details"}</Link>}
      </section>
    </div>
  </main>;
}
