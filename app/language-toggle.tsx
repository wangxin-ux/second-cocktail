"use client";

import { useI18n } from "@/lib/i18n";

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  return <div aria-label="Language" className="flex rounded-full border border-white/[0.12] p-0.5 text-[0.58rem] font-semibold tracking-[0.12em] text-white/45">
    {(["en", "zh"] as const).map((option) => <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)} className={`min-h-11 rounded-full px-2.5 transition-colors ${language === option ? "bg-white text-neutral-950" : "hover:text-white"}`}>{option === "en" ? "EN" : "中文"}</button>)}
  </div>;
}
