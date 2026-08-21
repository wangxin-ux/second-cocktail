"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import {
  completedProfileFields,
  energyOptions,
  mbtiOptions,
  type SecondProfile,
  writeSecondProfile,
  zodiacOptions,
} from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";

const inputClass =
  "min-h-13 w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-amber-100/35 focus:bg-white/[0.055]";

export default function ProfileForm() {
  const router = useRouter();
  const { profile, isHydrated } = useSecondProfile();

  function updateProfile<Key extends keyof SecondProfile>(
    key: Key,
    value: SecondProfile[Key],
  ) {
    writeSecondProfile({ ...profile, [key]: value || undefined });
  }

  function continueToSpirits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
            Back
          </Link>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">
            Step 01
          </span>
        </header>

        <section className="pb-7 pt-6">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/30">
            Your second profile
          </p>
          <h1 className="mt-3 max-w-sm text-[2.45rem] font-medium leading-[0.96] tracking-[-0.06em] text-stone-100 sm:text-[2.8rem]">
            Tell us a little. Or nothing at all.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/42">
            Up to six optional signals shape your drink and tonight&apos;s match.
            For this demo, they stay in this browser session.
          </p>
        </section>

        <form onSubmit={continueToSpirits}>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                Nickname
              </span>
              <input
                className={inputClass}
                maxLength={24}
                placeholder="What should we call you?"
                value={profile.nickname ?? ""}
                onChange={(event) => updateProfile("nickname", event.target.value)}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                Age
              </span>
              <input
                className={inputClass}
                inputMode="numeric"
                min={18}
                max={99}
                placeholder="18+"
                type="number"
                value={profile.age ?? ""}
                onChange={(event) =>
                  updateProfile(
                    "age",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                Height
              </span>
              <div className="relative">
                <input
                  className={`${inputClass} pr-12`}
                  inputMode="numeric"
                  min={120}
                  max={230}
                  placeholder="170"
                  type="number"
                  value={profile.heightCm ?? ""}
                  onChange={(event) =>
                    updateProfile(
                      "heightCm",
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/25">
                  cm
                </span>
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                Zodiac
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
                <option value="">Optional</option>
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
                <option value="">Optional</option>
                {mbtiOptions.map((mbti) => (
                  <option key={mbti} value={mbti}>
                    {mbti}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2 grid gap-2">
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-white/32">
                Tonight&apos;s energy
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
                <option value="">Optional</option>
                {energyOptions.map((energy) => (
                  <option key={energy.id} value={energy.id}>
                    {energy.label}
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
              Continue
            </button>
            <p className="mt-3 text-center text-[0.6rem] tracking-[0.08em] text-white/25">
              {isHydrated && completedProfileFields(profile) > 0
                ? `${completedProfileFields(profile)} of 6 added · all editable`
                : "Skip all fields and continue if you prefer"}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
