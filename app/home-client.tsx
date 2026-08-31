"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LanguageToggle from "./language-toggle";
import { useI18n } from "@/lib/i18n";
import { clearTonightSession, confirmAgeForTonight } from "@/lib/second/tonight-privacy";
import { useAgeConfirmation } from "./tonight-age-guard";
import TonightSignal from "./tonight-signal";

export default function Home() {
  const { language, t } = useI18n();
  const router = useRouter();
  const ageConfirmed = useAgeConfirmation();
  const [showGate, setShowGate] = useState(false);
  const [checked, setChecked] = useState(false);
  const gate = language === "zh" ? { title: "今晚仅限 18 岁及以上用户", body: "这是自行确认，不是身份或年龄验证。确认后，你可以开始本次 Tonight Session。", label: "我确认自己已满 18 岁", cancel: "暂不开始", confirm: "确认并继续" } : { title: "Tonight is for guests 18 and over", body: "This is a self-declaration, not identity or age verification. Confirm to begin this Tonight Session.", label: "I confirm that I am 18 or over", cancel: "Not now", confirm: "Confirm and continue" };
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/match-state", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => { if (response.status === 401) clearTonightSession(); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  function beginTonight() {
    if (ageConfirmed) router.push("/profile");
    else setShowGate(true);
  }
  function confirm() {
    confirmAgeForTonight();
    setShowGate(false);
    router.push("/profile");
  }
  return (
    <main className="relative min-h-dvh overflow-hidden px-[var(--space-page)] pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[12%] h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/[0.035] blur-3xl"
      />

      <section className="second-shell relative z-10 flex min-h-[calc(100dvh-3.5rem)] flex-col">
        <div className="flex items-center justify-between"><p className="second-micro text-white/55">Tonight / 01</p><LanguageToggle /></div>
        <div className="relative mt-[8svh] sm:mt-[13svh]">
          <p className="second-kicker">A drink, then a connection.</p>
          <h1 className="second-display mt-7 lowercase text-stone-100">second</h1>
          <TonightSignal
            stage="invitation"
            compact
            label={language === "zh" ? "尚未完成的今晚信号，来自 108 杯酒" : "An unfinished signal for tonight, drawn from 108 drinks"}
            className="ml-auto -mt-5 mr-[2%] opacity-90"
          />
          <div className="ml-[18%] mt-8 border-l border-white/20 pl-5">
            <p className="second-section-title max-w-[13ch] text-stone-100">{t("homeTitle")}</p>
            <p className="second-body mt-4 max-w-[25rem]">{t("homeBody")}</p>
          </div>
        </div>
        <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={beginTonight}
          className="second-primary"
        >
          <span className="flex items-center justify-center">
            {t("homeCta")}
          </span>
        </button>
        <p className="second-caption mt-4 text-center">{language === "zh" ? "18+ · 仅限双方接受 · Connection 可选" : "18+ · Mutual only · Connection is optional"}</p>
        </div>
      </section>
      {showGate ? <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-5 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="age-gate-title"><div className="second-dialog text-left"><p className="second-micro">{language === "zh" ? "今晚之前" : "Before tonight"}</p><h2 id="age-gate-title" className="second-subtitle mt-3 text-stone-100">{gate.title}</h2><p className="second-body mt-3">{gate.body}</p><label className="mt-5 flex min-h-14 cursor-pointer items-start gap-3 border-y border-white/[0.14] py-4"><input className="mt-0.5 h-5 w-5 accent-[#c8aa80]" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} /><span className="text-sm leading-5 text-white/75">{gate.label}</span></label><div className="mt-5 grid gap-3"><button type="button" disabled={!checked} className="second-primary" onClick={confirm}>{gate.confirm}</button><button type="button" className="second-secondary" onClick={() => setShowGate(false)}>{gate.cancel}</button></div></div></div> : null}
    </main>
  );
}
