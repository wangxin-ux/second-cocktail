"use client";

import Link from "next/link";
import LanguageToggle from "./language-toggle";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[12%] h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/[0.035] blur-3xl"
      />

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-7 flex w-full items-center justify-between"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-white/40">second</p><LanguageToggle /></div>

        <h1 className="text-balance text-[2.65rem] font-medium leading-[1.06] tracking-[-0.055em] text-stone-100 sm:text-5xl">
          {t("homeTitle")}
        </h1>

        <p className="mt-5 max-w-xs text-sm leading-6 text-white/38">
          {t("homeBody")}
        </p>

        <Link
          href="/profile"
          className="mt-12 min-h-14 w-full rounded-full border border-white/15 bg-white px-6 text-sm font-semibold tracking-[-0.01em] text-neutral-950 transition-colors duration-200 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:bg-stone-300"
        >
          <span className="flex min-h-14 items-center justify-center">
            {t("homeCta")}
          </span>
        </Link>
      </section>
    </main>
  );
}
