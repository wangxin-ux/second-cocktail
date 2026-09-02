"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FlavorId } from "../flavors/flavors";
import type { SpiritId } from "../spirits/spirits";
import LanguageToggle from "../language-toggle";
import EndTonightControl from "../end-tonight-control";
import TonightSignal, { getTonightSignalNumber } from "../tonight-signal";
import { readTonightCocktailSession } from "@/lib/cocktails/tonight-session";
import { localizeCocktailRecipe } from "@/lib/cocktails/localize-recipe";
import { RealtimeMatchService } from "@/lib/second/realtime-match-service";
import type { CanonicalMatchState } from "@/server/realtime/socket-events";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import { localizeEnergy, useI18n } from "@/lib/i18n";
import { energyOptions } from "@/lib/second/profile";
import { dismissEndedPair, wasEndedPairDismissed } from "@/lib/second/tonight-privacy";

const primary = "second-primary";
const secondary = "second-secondary";
const signals = (profile: ReturnType<typeof useSecondProfile>["profile"], cocktail: ReturnType<typeof readTonightCocktailSession>, spirit: SpiritId, flavor: FlavorId, language: "en" | "zh", directMatch: boolean) => ({ nickname: profile.nickname ?? "", age: profile.age ?? 0, meetingLocation: profile.meetingLocation ?? "", energy: profile.energy ?? "open", ...(profile.mbti ? { mbti: profile.mbti } : {}), spirit: cocktail?.spirit ?? spirit, flavor: cocktail?.flavor ?? flavor, cocktailId: cocktail?.result.recipe.id ?? (directMatch ? "direct-profile-match" : ""), cocktailName: cocktail ? localizeCocktailRecipe(cocktail.result.recipe, language).name : (directMatch ? "second" : ""), ageBand: 0 });

type LocalizedMessage = { en: string; zh: string; profileRequired?: boolean };

function realtimeErrorMessage(reason: unknown, fallback: LocalizedMessage): LocalizedMessage {
  const message = reason instanceof Error ? reason.message : "";
  if (message.includes("tonight signals")) {
    return {
      en: "Please complete your tonight profile before joining the queue.",
      zh: "请先完善今晚的个人信息，再加入匹配队列。",
      profileRequired: true,
    };
  }
  if (message.includes("dismiss the ended match")) {
    return {
      en: "Unable to dismiss the ended match. Please try again shortly.",
      zh: "暂时无法关闭已结束的匹配，请稍后再试。",
    };
  }
  return fallback;
}

function Timer({ seconds }: { seconds: number }) {
  return <p role="timer" aria-label={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} className="font-[family-name:var(--font-display)] text-[clamp(6rem,28vw,12rem)] leading-none tracking-[-.08em] tabular-nums text-stone-100">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</p>;
}

export default function RealtimeMatchExperience({ spirit, flavor, directMatch = false }: { spirit: { id: SpiritId; name: string }; flavor: { id: FlavorId; name: string }; directMatch?: boolean }) {
  const { profile, isHydrated } = useSecondProfile();
  const { language } = useI18n(); const zh = language === "zh";
  const router = useRouter();
  const [consented, setConsented] = useState(false); const [error, setError] = useState<LocalizedMessage | null>(null); const [restoring, setRestoring] = useState(true); const [secondsLeft, setSecondsLeft] = useState(300); const [queueSeconds, setQueueSeconds] = useState(0); const [isReturningToDrink, setIsReturningToDrink] = useState(false);
  const [state, setState] = useState<CanonicalMatchState>({ stage: "idle", serverNow: new Date().toISOString() });
  const service = useMemo(() => new RealtimeMatchService(), []); const cocktail = isHydrated ? readTonightCocktailSession() : null;
  const href = directMatch ? "/profile" : `/flavors/next?${new URLSearchParams({ spirit: spirit.id, flavor: flavor.id }).toString()}`;
  const c = (en: string, cn: string) => zh ? cn : en; const candidate = state.candidate;
  const energy = candidate ? energyOptions.find((item) => item.id === candidate.energy) : null;
  const num = cocktail ? getTonightSignalNumber(cocktail.result.recipe.id, spirit.id, flavor.id) : undefined;
  useEffect(() => {
    const controller = new AbortController();
    const off = service.subscribe((next) => {
      setState(next.stage === "ended" && wasEndedPairDismissed(next.pairId)
        ? { stage: "idle", serverNow: next.serverNow }
        : next);
    });
    const unavailable = { en: "Tonight’s connection is temporarily unavailable. Please try again shortly.", zh: "今晚的连接暂时不可用。请稍后再试。" };
    const offError = service.subscribeError(() => setError(unavailable));
    void service.restore(controller.signal)
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(unavailable);
      })
      .finally(() => { if (!controller.signal.aborted) setRestoring(false); });
    return () => { controller.abort(); off(); offError(); service.disconnect(); };
  }, [service]);
  useEffect(() => { if (state.stage !== "connection" || !state.endsAt) return; const tick = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(state.endsAt!).getTime() - Date.now()) / 1000))); tick(); const id = window.setInterval(tick, 1000); return () => clearInterval(id); }, [state.endsAt, state.stage]);
  useEffect(() => { if (state.stage !== "waiting" || !state.enteredQueueAt) return; const tick = () => setQueueSeconds(Math.max(0, Math.floor((Date.now() - new Date(state.enteredQueueAt!).getTime()) / 1000))); tick(); const id = window.setInterval(tick, 1000); return () => clearInterval(id); }, [state.enteredQueueAt, state.stage]);
  const action = (work: () => Promise<void>) => { setError(null); void work().catch((reason) => setError(realtimeErrorMessage(reason, { en: "Realtime request failed.", zh: "实时匹配请求未完成，请稍后再试。" }))); };
  const join = () => action(() => cocktail || directMatch
    ? service.start(signals(profile, cocktail, spirit.id, flavor.id, language, directMatch))
    : service.joinExistingSession());
  const returnToDrink = () => {
    setError(null);
    setIsReturningToDrink(true);
    void service.leave()
      .then(() => {
        dismissEndedPair(state.pairId ?? "");
        router.push(href);
      })
      .catch(() => router.push(href));
  };
  const returnFromEndedMatch = () => {
    const pairId = state.pairId;
    if (!pairId) return router.push(href);
    setError(null);
    setIsReturningToDrink(true);
    void service.dismissEndedMatch(pairId)
      .then(() => {
        dismissEndedPair(pairId);
        router.push(href);
      })
      .catch((reason) => {
        setError(realtimeErrorMessage(reason, directMatch ? { en: "Unable to return to your profile.", zh: "暂时无法返回个人信息页，请稍后再试。" } : { en: "Unable to return to your drink.", zh: "暂时无法回到我的酒，请稍后再试。" }));
        setIsReturningToDrink(false);
      });
  };
  const restartFromEndedMatch = () => {
    const pairId = state.pairId;
    if (!pairId) return setState({ stage: "idle", serverNow: new Date().toISOString() });
    setError(null);
    void service.dismissEndedMatch(pairId)
      .then((next) => {
        dismissEndedPair(pairId);
        setConsented(false);
        setState(next);
      })
      .catch((reason) => setError(realtimeErrorMessage(reason, { en: "Unable to start again.", zh: "暂时无法重新开始，请稍后再试。" })));
  };
  const signal = (stage: "reveal" | "searching" | "mutual", label: string, compact = false) => <TonightSignal stage={stage} spirit={spirit.id} flavor={flavor.id} cocktailNumber={num} partnerSeed={candidate?.nickname} compact={compact} label={label} className="mx-auto mb-7 w-52" />;

  if (restoring) {
    return <main className="second-match flex min-h-dvh items-center justify-center bg-[#080808] px-5"><div className="text-center" role="status" aria-live="polite"><p className="second-micro text-amber-100/58">{c("SECOND ACT", "第二幕")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("Restoring tonight…", "正在恢复今晚…")}</h1></div></main>;
  }

  return <main data-stage={state.stage} className="second-match min-h-dvh overflow-x-hidden bg-[#080808] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6"><div className="mx-auto w-full max-w-md">
    <header className="flex min-h-11 items-center justify-between gap-3">{state.stage === "idle" ? <Link href={href} className="inline-flex min-h-11 items-center text-[.62rem] font-semibold uppercase tracking-[.14em] text-white/48">← {directMatch ? c("My profile", "我的信息") : c("My drink", "我的酒")}</Link> : <button type="button" disabled={isReturningToDrink} onClick={state.stage === "ended" ? returnFromEndedMatch : returnToDrink} className="inline-flex min-h-11 items-center text-[.62rem] font-semibold uppercase tracking-[.14em] text-white/48">← {directMatch ? c("My profile", "我的信息") : c("My drink", "我的酒")}</button>}<div className="flex items-center gap-2"><LanguageToggle /><EndTonightControl /></div></header>
    <section className="second-stage flex min-h-[calc(100svh-5rem)] flex-col justify-center py-7">
      {state.stage === "idle" && <div><p className="second-micro text-amber-100/58">{c("SECOND ACT", "第二幕")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("Before we begin", "在开始之前")}</h1><ul className="mt-7 space-y-3 border-y border-white/[.12] py-6 text-sm leading-6 text-white/58"><li>{c("They will see a limited Tonight Profile.", "对方会看到有限的今晚档案。")}</li><li>{c("No contact details are shared.", "不会看到联系方式。")}</li><li>{c("A meeting area appears only after mutual yes.", "只有双方都愿意见面后才会出现见面地点。")}</li><li>{c("You can leave tonight’s matching at any time.", "你随时可以离开今晚的匹配。")}</li></ul><label className="mt-6 flex min-h-11 cursor-pointer gap-3 text-xs leading-5 text-white/54"><input checked={consented} onChange={(e) => setConsented(e.target.checked)} type="checkbox" className="mt-0.5 h-4 w-4 accent-[#eadfce]" /><span>{c("I understand these boundaries and want to start looking.", "我理解这些边界，并愿意开始寻找。")}</span></label><button disabled={!consented} className={`${primary} mt-6`} onClick={join}>{c("Start looking", "开始寻找")}</button><Link href={href} className={`${secondary} mt-3`}>{directMatch ? c("Back to my profile", "返回我的信息") : c("Back to my drink", "返回我的酒")}</Link></div>}
      {state.stage === "waiting" && <div className="text-center" role="status" aria-live="polite">{signal("reveal", c("One signal waiting", "一个信号正在等待"))}<p className="second-micro text-amber-100/58">{c("WAITING", "等待中")}</p><p className="mt-2 font-[family-name:var(--font-display)] text-4xl tabular-nums text-stone-100">{String(Math.floor(queueSeconds / 60)).padStart(2, "0")}:{String(queueSeconds % 60).padStart(2, "0")}</p><h1 className="second-screen-title mt-6 text-stone-100">{c("Looking for another signal tonight", "正在寻找今晚的另一个信号")}</h1><p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-white/48">{c("You don’t need to watch the screen. We’ll let you know when someone appears.", "不用一直盯着屏幕。有人出现时，我们会告诉你。")}</p><button className={`${secondary} mx-auto mt-8 max-w-xs`} onClick={() => action(() => service.cancelQueue())}>{c("Cancel", "取消等待")}</button></div>}
      {state.stage === "candidate" && candidate && <div>{signal("searching", c("Two signals drawing closer", "两个信号正在靠近"))}<p className="second-micro text-amber-100/58">{c("ONE POSSIBLE INTRODUCTION", "一次可能的介绍")}</p><h1 className="second-screen-title mt-4 text-stone-100">{c("Someone appeared tonight", "今晚，有一个人出现了")}</h1><p className="mt-5 text-lg text-white/86">{candidate.nickname} <span className="text-white/36">·</span> {candidate.age}</p><p className="mt-2 text-xs font-semibold tracking-[.15em] text-white/42">{energy ? localizeEnergy(energy.id, energy.label, language) : candidate.energy}</p><div className="mt-6 border-y border-white/[.13] py-5"><p className="second-micro text-amber-100/58">{c("WHY YOU TWO", "为什么是你们")}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-white/66">{candidate.reasons.map((reason) => <li key={reason.id}>— {reason[language]}</li>)}</ul></div><div className="mt-5 border-l border-amber-100/45 py-1 pl-4"><p className="second-micro text-white/40">{c("OPENING SIGNAL", "开场信号")}</p><p className="mt-2 text-[1rem] leading-6 text-stone-100/88">“{candidate.openingPrompt[language]}”</p></div><div className="mt-7 grid gap-3"><button className={primary} onClick={() => action(() => service.accept())}>{c("I’d meet them", "愿意见面")}</button><button className={secondary} onClick={() => action(() => service.pass())}>{c("Pass", "暂时不见")}</button><button className="min-h-11 text-xs text-white/45 underline underline-offset-4" onClick={() => action(() => service.block())}>{c("Do not show this person again tonight", "今晚不再匹配此人")}</button></div></div>}
      {state.stage === "waiting_for_other" && candidate && <div className="text-center">{signal("searching", c("Your signal is waiting", "你的信号正在等待"))}<p className="second-micro text-amber-100/58">{c("WAITING FOR THEM", "等待对方")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("You said yes", "你愿意见面了")}</h1><p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-white/50">{c("Now leave the choice with them. If they agree too, second will tell you where to meet.", "现在，把选择留给对方。如果对方也愿意，second 会告诉你们在哪里见面。")}</p><button className={`${secondary} mx-auto mt-8 max-w-xs`} onClick={() => action(() => service.leave())}>{c("Leave tonight’s match", "离开今晚的匹配")}</button></div>}
      {state.stage === "mutual" && candidate && state.meetingLocation && <div className="text-center">{signal("mutual", c("Two signals, one shared mark", "两个信号汇成一个共同标记"))}<p className="second-micro text-amber-100/58">{c("SECOND ACT · MUTUAL", "第二幕 · 双方同意")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("You both said yes", "你们都愿意见面")}</h1><p className="mt-4 text-sm text-white/55">{c("Now make it real.", "接下来，去真实世界里找到彼此。")}</p><div className="mt-7 border-y border-white/[.14] py-6"><p className="second-micro text-white/42">{c("MEETING LOCATION", "见面地点")}</p><p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-stone-100">{state.meetingLocation}</p><p className="mt-3 text-xs text-white/43">{c("Randomly selected from the two locations you provided.", "已从你们填写的两个地点中随机选出。")}</p></div><button className={`${primary} mt-7`} onClick={() => action(() => service.beginConnection())}>{c("Start five minutes", "开始五分钟")}</button></div>}
      {state.stage === "connection" && candidate && <div className="flex flex-1 flex-col justify-center py-7 text-center"><p className="second-micro text-amber-100/58">{c("SECOND ACT", "第二幕")}</p><p className="mt-6 text-sm text-white/52">{c("Five minutes to find each other", "五分钟内找到彼此")}</p><div className="mt-6"><Timer seconds={secondsLeft} /></div>{state.meetingLocation && <div className="mt-10 border-y border-white/[.14] py-5"><p className="second-micro text-white/42">{c("MEETING LOCATION", "见面地点")}</p><p className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.4rem,11vw,5.5rem)] leading-none text-stone-100">{state.meetingLocation}</p></div>}<p className="mt-8 text-sm text-white/58">{candidate.nickname} · {language === "zh" ? `${candidate.age} 岁` : `Age ${candidate.age}`} <span className="mx-2 text-white/28">×</span> {profile.nickname || c("You", "你")} · {language === "zh" ? `${profile.age ?? "—"} 岁` : `Age ${profile.age ?? "—"}`}</p><div className="mt-9 border-l border-amber-100/40 py-1 pl-4 text-left"><p className="second-micro text-white/40">{c("START HERE", "从这里开始")}</p><p className="mt-2 text-[.98rem] leading-6 text-stone-100/88">“{candidate.openingPrompt[language]}”</p></div><button className="mx-auto mt-10 min-h-11 text-xs text-white/42 underline underline-offset-4" onClick={() => action(() => service.report("unsafe"))}>{c("Report / get help", "举报 / 求助")}</button></div>}
      {state.stage === "time_up" && <div className="text-center"><p className="second-micro text-amber-100/58">{c("TIME’S UP", "时间到")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("Five minutes are up.", "五分钟到了。")}</h1><p className="mt-5 text-sm text-white/55">{c("Would you like to keep the story going?", "还想继续聊吗？")}</p><div className="mt-8 grid gap-3"><button className={primary} onClick={() => action(() => service.continueConnection())}>{c("Keep the story going", "继续这个故事")}</button><button className={secondary} onClick={() => action(() => service.finishConnection())}>{c("That’s enough for tonight", "到这里就好")}</button></div></div>}
      {state.stage === "waiting_for_continue" && <div className="text-center">{signal("mutual", c("Shared signal waiting", "共同信号正在等待"), true)}<p className="second-micro text-amber-100/58">{c("WAITING FOR THEM", "等待对方")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("You’d like to continue", "你愿意继续")}</h1><p className="mt-5 text-sm text-white/50">{c("Now leave the choice with them.", "现在，把选择留给对方。")}</p></div>}
      {state.stage === "continuing" && <div className="text-center">{signal("mutual", c("Shared signal", "共同信号"), true)}<p className="second-micro text-amber-100/58">{c("SECOND ACT", "第二幕")}</p><h1 className="second-screen-title mt-5 text-stone-100">{c("Let the story continue.", "让故事继续。")}</h1><p className="mt-5 text-sm leading-6 text-white/55">{c("Put the phone away. The rest is yours.", "把手机放下，剩下的故事交给你们。")}</p><button type="button" disabled={isReturningToDrink} className={`${primary} mt-8`} onClick={returnToDrink}>{isReturningToDrink ? c("Returning…", "正在返回…") : directMatch ? c("Back to my profile", "返回我的信息") : c("Back to my drink", "回到我的酒")}</button></div>}
      {state.stage === "ended" && <div className="text-center"><p className="second-micro text-amber-100/58">second</p><h1 className="second-screen-title mt-5 text-stone-100">{c("The night continues, so does the story.", "夜晚还在继续，故事也是。")}</h1><div className="mt-8 grid gap-3"><button className={primary} onClick={restartFromEndedMatch}>{c("Meet someone else", "再认识一个人")}</button><button type="button" disabled={isReturningToDrink} className={secondary} onClick={returnFromEndedMatch}>{directMatch ? c("Back to my profile", "返回我的信息") : c("Back to my drink", "回到我的酒")}</button></div></div>}
      {error && <p role="alert" className="mt-6 text-sm text-rose-200/80">{error.profileRequired ? <>{c("Please complete your tonight profile (", "请先完善今晚的个人信息（")}<Link href="/profile" className="font-semibold underline decoration-rose-200/60 underline-offset-4">{c("click here", "点击这里")}</Link>{c(") before joining the queue.", "），再加入匹配队列。")}</> : error[language]}</p>}
    </section>
  </div></main>;
}
