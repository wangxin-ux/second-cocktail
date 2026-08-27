"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { clearTonightSession } from "@/lib/second/tonight-privacy";

export default function EndTonightControl() {
  const router = useRouter();
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const text = language === "zh" ? { trigger: "结束今晚", title: "结束今晚？", body: "这会清除本次会话中的档案、Cocktail、匹配、屏蔽名单和见面区域。语言偏好会保留。", cancel: "继续今晚", confirm: "清除并结束" } : { trigger: "End tonight", title: "End tonight?", body: "This clears this session’s profile, cocktail, match, blocked people, and meeting area. Your language preference stays.", cancel: "Keep tonight", confirm: "Clear and end" };
  async function confirmEnd() {
    setError("");
    const response = await fetch("/api/end-tonight", { method: "POST", credentials: "same-origin" }).catch(() => null);
    if (!response?.ok) {
      setError(language === "zh" ? "暂时无法安全结束今晚。请稍后再试。" : "Tonight could not be ended safely. Please try again shortly.");
      return;
    }
    clearTonightSession();
    setOpen(false);
    router.push("/");
  }
  return <>
    <button type="button" className="min-h-11 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/32" onClick={() => setOpen(true)}>{text.trigger}</button>
    {open ? <div className="fixed inset-0 z-[80] flex items-end bg-black/80 p-5 sm:items-center sm:justify-center" role="alertdialog" aria-modal="true" aria-labelledby="end-tonight-title"><div className="second-dialog"><p className="second-kicker">Session control</p><h2 id="end-tonight-title" className="second-section-title mt-3 text-stone-100">{text.title}</h2><p className="second-body mt-3">{text.body}</p>{error ? <p role="alert" className="mt-4 text-sm text-rose-200/90">{error}</p> : null}<div className="mt-6 grid gap-3"><button type="button" className="second-primary" onClick={confirmEnd}>{text.confirm}</button><button type="button" autoFocus className="second-secondary" onClick={() => setOpen(false)}>{text.cancel}</button></div></div></div> : null}
  </>;
}
