"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spirits, type SpiritId } from "./spirits";

export default function SpiritSelectionPage() {
  const router = useRouter();
  const [selectedSpirit, setSelectedSpirit] = useState<SpiritId | null>(null);

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

      <div className="relative mx-auto flex min-h-[calc(100dvh-2.25rem)] w-full max-w-md flex-col">
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
            Back
          </Link>

          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">
            Step 02
          </span>
        </header>

        <section className="pb-5 pt-6">
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.26em] text-white/35">
            Base Spirit
          </p>
          <h1 className="text-[2.35rem] font-medium leading-none tracking-[-0.055em] text-stone-100 sm:text-[2.65rem]">
            Choose your spirit.
          </h1>
          <p className="mt-3 text-sm tracking-[-0.01em] text-white/45">
            Every night starts with a base.
          </p>
        </section>

        <div
          aria-label="Base spirit"
          className="grid gap-1.5"
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
                className={`group relative flex min-h-16 w-full items-center overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100/70 active:scale-[0.99] ${
                  isSelected
                    ? "scale-[1.01] border-amber-100/35 bg-gradient-to-r from-amber-100/[0.12] to-white/[0.035] shadow-[0_0_30px_rgba(224,190,142,0.08)]"
                    : "border-white/[0.07] bg-white/[0.018] hover:border-white/15 hover:bg-white/[0.04]"
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
                    className={`text-[1.05rem] font-medium tracking-[-0.025em] transition-colors ${
                      isSelected ? "text-white" : "text-white/78"
                    }`}
                  >
                    {spirit.name}
                  </span>
                  <span
                    className={`shrink-0 text-[0.69rem] tracking-[0.04em] transition-colors ${
                      isSelected ? "text-amber-50/70" : "text-white/30"
                    }`}
                  >
                    {spirit.profile}
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
            className="min-h-14 w-full rounded-full border border-white/15 bg-white px-6 text-sm font-semibold tracking-[-0.01em] text-neutral-950 transition-all duration-200 enabled:hover:bg-stone-200 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.055] disabled:text-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}
