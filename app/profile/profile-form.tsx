"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  completedProfileFields,
  energyOptions,
  mbtiOptions,
  type SecondProfile,
  writeSecondProfile,
  zodiacOptions,
} from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import LanguageToggle from "../language-toggle";
import { localizeEnergy, useI18n } from "@/lib/i18n";

const inputClass =
  "min-h-13 w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-amber-100/35 focus:bg-white/[0.055]";

function optionalNumberInput(value: string, min: number, max: number) {
  if (!/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
}

export default function ProfileForm() {
  const router = useRouter();
  const { profile, isHydrated } = useSecondProfile();
  const { language, t } = useI18n();
  const [numericDraft, setNumericDraft] = useState<{
    age?: string;
    heightCm?: string;
  }>({});

  const ageInput = numericDraft.age ?? profile.age?.toString() ?? "";
  const heightInput =
    numericDraft.heightCm ?? profile.heightCm?.toString() ?? "";
  const ageIsInvalid =
    ageInput !== "" && optionalNumberInput(ageInput, 18, 99) === undefined;
  const heightIsInvalid =
    heightInput !== "" &&
    optionalNumberInput(heightInput, 120, 230) === undefined;

  function updateProfile<Key extends keyof SecondProfile>(
    key: Key,
    value: SecondProfile[Key],
  ) {
    writeSecondProfile({ ...profile, [key]: value || undefined });
  }

  function updateNumericProfile(
    key: "age" | "heightCm",
    rawValue: string,
    min: number,
    max: number,
    maxLength: number,
  ) {
    const digits = rawValue.replace(/\D/g, "").slice(0, maxLength);
    setNumericDraft((current) => ({ ...current, [key]: digits }));
    updateProfile(key, optionalNumberInput(digits, min, max));
  }

  function continueToSpirits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ageIsInvalid || heightIsInvalid) return;
    writeSecondProfile(profile);
    router.push("/spirits");
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden px-5 pb-5 pt-5 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-amber-100/[0.045] blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-md">
        <header className="flex min-h-10 items-center justify-between">
          <Link
            href="/"
            className="group inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span aria-hidden="true">←</span>
            {t("back")}
          </Link>
          <div className="flex items-center gap-3"><LanguageToggle /><span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">{t("profileStep")}</span></div>
        </header>

        <section className="pb-7 pt-6">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/30">
            {t("profileEyebrow")}
          </p>
          <h1 className="mt-3 max-w-sm text-[2.45rem] font-medium leading-[0.96] tracking-[-0.06em] text-stone-100 sm:text-[2.8rem]">
            {t("profileTitle")}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/42">
            {t("profileBody")}
          </p>
        </section>

        <form onSubmit={continueToSpirits}>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("nickname")}
              </span>
              <input
                className={inputClass}
                maxLength={24}
                placeholder={t("nicknamePlaceholder")}
                value={profile.nickname ?? ""}
                onChange={(event) => updateProfile("nickname", event.target.value)}
              />
            </label>

            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("meetingLocation")}
              </span>
              <input
                className={inputClass}
                maxLength={80}
                placeholder={t("meetingLocationPlaceholder")}
                value={profile.meetingLocation ?? ""}
                onChange={(event) => updateProfile("meetingLocation", event.target.value)}
              />
              <span className="text-[0.62rem] leading-5 text-white/28">{t("meetingLocationHelp")}</span>
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("age")}
              </span>
              <input
                className={inputClass}
                aria-describedby={ageIsInvalid ? "age-error" : undefined}
                aria-invalid={ageIsInvalid}
                autoComplete="off"
                enterKeyHint="next"
                inputMode="numeric"
                maxLength={2}
                pattern="[0-9]*"
                placeholder="18+"
                type="text"
                value={ageInput}
                onChange={(event) =>
                  updateNumericProfile(
                    "age",
                    event.target.value,
                    18,
                    99,
                    2,
                  )
                }
              />
              {ageIsInvalid ? (
                <span id="age-error" className="text-[0.6rem] text-amber-100/60">
                  {t("ageError")}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("height")}
              </span>
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  aria-describedby={
                    heightIsInvalid ? "height-error" : undefined
                  }
                  aria-invalid={heightIsInvalid}
                  autoComplete="off"
                  enterKeyHint="next"
                  inputMode="numeric"
                  maxLength={3}
                  pattern="[0-9]*"
                  placeholder="170"
                  type="text"
                  value={heightInput}
                  onChange={(event) =>
                    updateNumericProfile(
                      "heightCm",
                      event.target.value,
                      120,
                      230,
                      3,
                    )
                  }
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/25">
                  cm
                </span>
              </div>
              {heightIsInvalid ? (
                <span
                  id="height-error"
                  className="text-[0.6rem] text-amber-100/60"
                >
                  {t("heightError")}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("zodiac")}
              </span>
              <select
                className={inputClass}
                value={profile.zodiac ?? ""}
                onChange={(event) =>
                  updateProfile(
                    "zodiac",
                    event.target.value as SecondProfile["zodiac"],
                  )
                }
              >
                <option value="">{t("optional")}</option>
                {zodiacOptions.map((zodiac) => (
                  <option key={zodiac} value={zodiac}>
                    {zodiac}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                MBTI
              </span>
              <select
                className={inputClass}
                value={profile.mbti ?? ""}
                onChange={(event) =>
                  updateProfile(
                    "mbti",
                    event.target.value as SecondProfile["mbti"],
                  )
                }
              >
                <option value="">{t("optional")}</option>
                {mbtiOptions.map((mbti) => (
                  <option key={mbti} value={mbti}>
                    {mbti}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("energy")}
              </span>
              <select
                className={inputClass}
                value={profile.energy ?? ""}
                onChange={(event) =>
                  updateProfile(
                    "energy",
                    event.target.value as SecondProfile["energy"],
                  )
                }
              >
                <option value="">{t("optional")}</option>
                {energyOptions.map((energy) => (
                  <option key={energy.id} value={energy.id}>
                    {localizeEnergy(energy.id, energy.label, language)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sticky bottom-0 z-20 mt-7 bg-gradient-to-t from-[#080808] via-[#080808]/96 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
            <button
              className="min-h-14 w-full rounded-full border border-white/15 bg-white px-6 text-sm font-semibold text-neutral-950 transition-all hover:bg-stone-200 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              type="submit"
            >
              {t("continue")}
            </button>
            <p className="mt-3 text-center text-[0.6rem] tracking-[0.08em] text-white/25">
              {isHydrated && completedProfileFields(profile) > 0
                ? t("profileSaved", { count: completedProfileFields(profile) })
                : t("profileSkip")}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
