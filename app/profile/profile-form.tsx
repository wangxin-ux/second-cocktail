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
import PrivacySummary from "../privacy-summary";
import EndTonightControl from "../end-tonight-control";
import TonightSignal from "../tonight-signal";

const inputClass =
  "second-field text-sm placeholder:text-white/25";

const zodiacNamesZh: Record<string, string> = {
  Aries: "白羊座",
  Taurus: "金牛座",
  Gemini: "双子座",
  Cancer: "巨蟹座",
  Leo: "狮子座",
  Virgo: "处女座",
  Libra: "天秤座",
  Scorpio: "天蝎座",
  Sagittarius: "射手座",
  Capricorn: "摩羯座",
  Aquarius: "水瓶座",
  Pisces: "双鱼座",
};

const personalityNamesZh: Record<string, string> = {
  INTJ: "建筑师型",
  INTP: "逻辑学家型",
  ENTJ: "指挥官型",
  ENTP: "辩论家型",
  INFJ: "提倡者型",
  INFP: "调停者型",
  ENFJ: "主人公型",
  ENFP: "竞选者型",
  ISTJ: "物流师型",
  ISFJ: "守卫者型",
  ESTJ: "总经理型",
  ESFJ: "执政官型",
  ISTP: "鉴赏家型",
  ISFP: "探险家型",
  ESTP: "企业家型",
  ESFP: "表演者型",
};

function optionalNumberInput(value: string, min: number, max: number) {
  if (!/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
}

export default function ProfileForm({ directMatch = false }: { directMatch?: boolean }) {
  const router = useRouter();
  const { profile, isHydrated } = useSecondProfile();
  const { language, t } = useI18n();
  const [numericDraft, setNumericDraft] = useState<{
    age?: string;
  }>({});

  const ageInput = numericDraft.age ?? profile.age?.toString() ?? "";
  const ageIsInvalid =
    ageInput !== "" && optionalNumberInput(ageInput, 18, 99) === undefined;
  const completedFields = completedProfileFields(profile);
  const directProfileComplete = Boolean(
    profile.nickname?.trim() &&
    profile.age &&
    profile.meetingLocation?.trim() &&
    profile.energy,
  );

  function updateProfile<Key extends keyof SecondProfile>(
    key: Key,
    value: SecondProfile[Key],
  ) {
    writeSecondProfile({ ...profile, [key]: value || undefined });
  }

  function updateNumericProfile(
    key: "age",
    rawValue: string,
    min: number,
    max: number,
    maxLength: number,
  ) {
    const digits = rawValue.replace(/\D/g, "").slice(0, maxLength);
    setNumericDraft((current) => ({ ...current, [key]: digits }));
    updateProfile(key, optionalNumberInput(digits, min, max));
  }

  function continueToNextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ageIsInvalid || (directMatch && !directProfileComplete)) return;
    writeSecondProfile(profile);
    router.push(directMatch ? "/match" : "/spirits");
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden px-5 pb-5 pt-5 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-amber-100/[0.045] blur-3xl"
      />
      <div className="second-shell relative">
        <header className="flex min-h-10 items-center justify-between">
          <Link
            href="/"
            className="group inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span aria-hidden="true">←</span>
            {t("back")}
          </Link>
          <div className="flex items-center gap-3"><LanguageToggle /><EndTonightControl /><span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">{t("profileStep")}</span></div>
        </header>

        <section className="pb-7 pt-6">
          <p className="second-micro text-amber-100/58">
            {directMatch ? (language === "zh" ? "今晚的匹配档案" : "Tonight’s matching profile") : t("profileEyebrow")}
          </p>
          <h1 className="second-screen-title mt-4 max-w-sm text-stone-100">
            {directMatch ? (language === "zh" ? "完善信息，直接开始匹配。" : "Complete your profile, then start matching.") : t("profileTitle")}
          </h1>
          <p className="second-body mt-5 max-w-sm">
            {directMatch ? (language === "zh" ? "填写昵称、年龄、公开见面地点和今晚状态。提交后将直接进入匹配，不会生成鸡尾酒或卡牌。" : "Add your nickname, age, public meeting location, and tonight’s energy. You’ll go straight to matching without generating a cocktail or card.") : t("profileBody")}
          </p>
          {directMatch ? <div className="second-rule mt-7 border-y border-white/[0.08] py-4 text-xs leading-5 text-white/55">{language === "zh" ? "这些信息仅用于今晚的匹配和双方同意后的见面。" : "This information is used only for tonight’s matching and a mutually accepted meeting."}</div> : <div className="second-rule mt-7 grid gap-0 text-xs leading-5 text-white/55">
            <div className="grid grid-cols-[6.5rem_1fr] border-b border-white/[0.08] py-4">
              <span className="second-micro text-amber-100/65">
                {t("shapesDrink")}
              </span>
              <span>{t("shapesDrinkFields")}</span>
            </div>
            <div className="grid grid-cols-[6.5rem_1fr] border-b border-white/[0.08] py-4">
              <span className="second-micro text-white/55">
                {t("connectionLater")}
              </span>
              <span>{t("connectionLaterFields")}</span>
            </div>
          </div>}
          <PrivacySummary className="mt-3 min-h-11 text-xs text-white/45 underline decoration-white/15 underline-offset-4" />
          <TonightSignal
            stage="profile"
            completion={completedFields}
            label={language === "zh" ? `今晚信号已加入 ${completedFields} 层个人信息` : `Tonight signal with ${completedFields} profile layers`}
            className="mt-4 ml-auto"
          />
        </section>

        <form onSubmit={continueToNextStep}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-7">
            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("nickname")}
              </span>
              <input
                className={inputClass}
                maxLength={24}
                required={directMatch}
                placeholder={t("nicknamePlaceholder")}
                value={profile.nickname ?? ""}
                onChange={(event) => updateProfile("nickname", event.target.value)}
              />
            </label>

            <label className="col-span-2 grid gap-2">
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
                required={directMatch}
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

            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("meetingLocation")}
              </span>
              <input
                className={inputClass}
                maxLength={80}
                placeholder={t("meetingLocationPlaceholder")}
                required={directMatch}
                value={profile.meetingLocation ?? ""}
                onChange={(event) => updateProfile("meetingLocation", event.target.value)}
              />
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
                    {language === "zh" ? zodiacNamesZh[zodiac] : zodiac}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {language === "zh" ? "性格类型" : "MBTI"}
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
                    {language === "zh" ? personalityNamesZh[mbti] : mbti}
                  </option>
                ))}
              </select>
            </label>

            <div className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                {t("energy")}
              </span>
              <div className="grid grid-cols-2 border-l border-t border-white/[0.12]" role="radiogroup" aria-label={t("energy")}>
                {energyOptions.map((energy) => {
                  const selected = profile.energy === energy.id;
                  return <button key={energy.id} type="button" role="radio" aria-checked={selected} onClick={() => updateProfile("energy", selected ? undefined : energy.id)} className={`second-focus min-h-14 border-b border-r border-white/[0.12] px-3 text-left text-xs transition-colors ${selected ? "bg-amber-100/[0.12] text-amber-50" : "text-white/52 hover:bg-white/[0.04] hover:text-white/80"}`}>{localizeEnergy(energy.id, energy.label, language)}</button>;
                })}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 mt-7 bg-gradient-to-t from-[#080808] via-[#080808]/96 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
            <button
              className="second-primary"
              disabled={directMatch && !directProfileComplete}
              type="submit"
            >
              {directMatch ? (language === "zh" ? "开始匹配" : "Start matching") : t("continue")}
            </button>
            <p className="mt-3 text-center text-[0.6rem] tracking-[0.08em] text-white/25">
              {directMatch
                ? (language === "zh" ? "昵称、年龄、见面地点和今晚状态为必填项" : "Nickname, age, meeting location, and tonight’s energy are required")
                : isHydrated && completedFields > 0
                ? t("profileSaved", { count: completedFields })
                : t("profileSkip")}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
