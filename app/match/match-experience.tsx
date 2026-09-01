"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlavorId } from "../flavors/flavors";
import type { SpiritId } from "../spirits/spirits";
import { readTonightCocktailSession } from "@/lib/cocktails/tonight-session";
import { localizeCocktailRecipe } from "@/lib/cocktails/localize-recipe";
import { projectCandidatePreview } from "@/lib/second/candidate-visibility";
import { DemoSafetyService } from "@/lib/second/demo-safety-service";
import { DemoMatchService, type DemoMatchScenario } from "@/lib/second/demo-match-service";
import { explainMatch } from "@/lib/second/match-explanation";
import { rankDemoCandidates } from "@/lib/second/match";
import type { CocktailSignals, MatchAvailability, MatchCandidate, MatchStage } from "@/lib/second/match-types";
import { createOpeningPrompt } from "@/lib/second/opening-prompt";
import { energyOptions } from "@/lib/second/profile";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import { demoVenueAreas, type VenueArea } from "@/lib/second/venue-areas";
import { localizeEnergy, useI18n } from "@/lib/i18n";
import type { ReportReason } from "@/lib/second/safety";
import { blockCandidateForTonight, clearCurrentMatchSession, readBlockedCandidateIds, writeCurrentMatchSnapshot } from "@/lib/second/tonight-privacy";
import LanguageToggle from "../language-toggle";
import PrivacySummary from "../privacy-summary";
import EndTonightControl from "../end-tonight-control";
import TonightSignal, { getTonightSignalNumber } from "../tonight-signal";

type MatchExperienceProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
  scenario: DemoMatchScenario;
};

const copy = {
  en: {
    introEyebrow: "Your drink, your choice", introTitle: "Your drink can stop here. Or become an introduction.", introBody: "Second can use tonight’s signals to find one person here with something worth starting a conversation around.", optional: "Connection is optional", mutual: "Both people must accept", private: "No contact details are shared automatically", leave: "You can leave anytime", continue: "Continue", consentTitle: "Before you connect", consentBody: "Please read these boundaries before this fictional matching demo uses tonight’s signals.", consentLabel: "I understand and agree to use my browser profile in this fictional matching demo.", start: "Look for one person", demoCount: "Demo availability · {count} fictional profiles", searching: "Looking for one person with a reason to talk.", searchingBody: "We’re comparing your drink and optional tonight signals. You can cancel without losing your cocktail.", cancel: "Cancel", emptyTitle: "No one else is here yet.", emptyBody: "Your drink is still yours. This demo has no available candidate in the current scenario.", keep: "Keep my drink", stay: "Stay available", staying: "You’ll stay available in this browser demo.", retry: "Try again later", candidate: "One possible introduction", why: "Why you two", opener: "Try opening with", meet: "Meet for 5 minutes", pass: "Pass", block: "Don’t match me with this person again tonight", waiting: "Waiting for them", waitingBody: "Nothing is shared yet. You’ll only move forward if they accept too.", leaveWaiting: "Leave", mutualTitle: "You both said yes.", mutualBody: "No contact details have been exchanged. Choose only an area of the venue for this five-minute hello.", chooseArea: "Choose a meeting area", areaTitle: "Where should you meet?", areaBody: "Choose a broad venue area only — never an exact seat or address.", startFive: "Start 5 minutes", connection: "Your five-minute connection", meetAt: "Meet {name} at {area}", end: "End now", help: "Need help?", helpTitle: "Get help now", helpBody: "Leave this connection and go directly to venue staff. This demo does not contact staff for you.", leaveNow: "Leave this connection now", findStaff: "Go directly to venue staff", report: "Report", ended: "That was your second story.", endedBody: "Nothing else is required. No rating and no contact exchange.", meetAnother: "Meet someone else", error: "Connection is unavailable.", errorBody: "Your cocktail is safe. Return to it or try this demo again.", back: "Back", reportTitle: "Report this connection", reportBody: "Choose the closest reason. This demo records the action only in this screen and cannot send a report to venue staff or moderators.", reportUnsafe: "I feel unsafe", reportHarassment: "Harassment or inappropriate behavior", reportIdentity: "Identity mismatch", reportOther: "Other", submitReport: "Submit report", reportResult: "Demo only: your report was not delivered. In a real launch, reports must reach venue staff or moderation.", close: "Close", sessionError: "This connection needs the cocktail saved in your Tonight Session.", demo: "Fictional browser demo",
  },
  zh: {
    introEyebrow: "你的酒，由你决定", introTitle: "这杯酒可以停在这里，也可以成为一次介绍。", introBody: "second 会用今晚的信号，找到一个真正有话题可以开始的人。", optional: "相遇完全可选", mutual: "双方都必须接受", private: "不会自动分享联系方式", leave: "你随时可以离开", continue: "继续", consentTitle: "连接之前", consentBody: "请先了解边界，再允许这个虚构匹配演示使用今晚的信号。", consentLabel: "我理解这些边界，并同意在虚构匹配演示中使用浏览器档案。", start: "寻找一个人", demoCount: "演示可用人数 · {count} 个虚构档案", searching: "正在寻找一个真正有理由开口的人。", searchingBody: "我们在比较双方的酒和可选的今晚信号。你可以取消，鸡尾酒不会丢失。", cancel: "取消", emptyTitle: "现在还没有其他人在这里。", emptyBody: "你的酒仍然属于你；当前演示场景里没有可用候选人。", keep: "保留我的酒", stay: "保持可匹配", staying: "你会在这个浏览器演示中保持可匹配。", retry: "稍后再试", candidate: "一次可能的介绍", why: "为什么是你们", opener: "可以这样开口", meet: "见面 5 分钟", pass: "跳过", block: "今晚不要再为我匹配这个人", waiting: "正在等待对方", waitingBody: "目前没有分享任何信息。只有对方也接受，才会继续。", leaveWaiting: "离开", mutualTitle: "你们都接受了。", mutualBody: "没有交换联系方式。现在只选择一个场所区域，进行五分钟的见面。", chooseArea: "选择见面区域", areaTitle: "在哪里见面？", areaBody: "只选择宽泛的场所区域，不填写精确座位或地址。", startFive: "开始 5 分钟", connection: "你们的五分钟相遇", meetAt: "与 {name} 在{area}见面", end: "现在结束", help: "需要帮助？", helpTitle: "立即获得帮助", helpBody: "离开这次相遇，并直接前往场所工作人员处。本演示不会替你联系工作人员。", leaveNow: "立即离开这次相遇", findStaff: "直接前往场所工作人员处", report: "举报", ended: "这是你今晚的第二个故事。", endedBody: "无需做任何评价，也不会交换联系方式。", meetAnother: "认识另一个人", error: "相遇暂时不可用。", errorBody: "你的鸡尾酒仍然保留。可以返回，或重新尝试这个演示。", back: "返回", reportTitle: "举报这次相遇", reportBody: "请选择最接近的原因。本演示只在当前画面记录操作，无法把举报发送给场所工作人员或审核团队。", reportUnsafe: "我感到不安全", reportHarassment: "骚扰或不当行为", reportIdentity: "身份不符", reportOther: "其他", submitReport: "提交举报", reportResult: "仅为演示：举报没有被送达。真实上线时，举报必须送达场所工作人员或审核团队。", close: "关闭", sessionError: "需要先在今晚的体验中保存一杯鸡尾酒，才能开始相遇。", demo: "虚构浏览器演示",
  },
} as const;

const primaryButton = "second-primary";
const secondaryButton = "second-secondary";

function interpolate(value: string, values: Record<string, string | number>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export default function MatchExperience({ spirit, flavor, scenario }: MatchExperienceProps) {
  const { profile, isHydrated } = useSecondProfile();
  const { language } = useI18n();
  const c = copy[language];
  const [stage, setStage] = useState<MatchStage>("intro");
  const [cocktail, setCocktail] = useState<CocktailSignals | null>(null);
  const [cocktailNumber, setCocktailNumber] = useState<number>();
  const [availability, setAvailability] = useState<MatchAvailability | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [candidate, setCandidate] = useState<MatchCandidate | null>(null);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [meetingArea, setMeetingArea] = useState<VenueArea | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isStaying, setIsStaying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [reportResult, setReportResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const searchRequest = useRef(0);
  const acceptanceRequest = useRef(0);
  const safetyService = useMemo(() => new DemoSafetyService(), []);

  const rankedCandidates = useMemo(() => rankDemoCandidates(profile, spirit.id, flavor.id), [flavor.id, profile, spirit.id]);
  const service = useMemo(() => new DemoMatchService(scenario, rankedCandidates), [rankedCandidates, scenario]);
  const drinkHref = `/flavors/next?${new URLSearchParams({ spirit: spirit.id, flavor: flavor.id }).toString()}`;

  const exitMatchSession = useCallback(() => {
    searchRequest.current += 1;
    acceptanceRequest.current += 1;
    setCandidate(null);
    setMeetingArea(null);
    setSecondsLeft(300);
    setHasConsented(false);
    clearCurrentMatchSession();
    setStage("ended");
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const blockedIds = readBlockedCandidateIds();
    queueMicrotask(() => setExcludedIds(blockedIds));
    const session = readTonightCocktailSession();
    if (!session || session.spirit !== spirit.id || session.flavor !== flavor.id) {
      queueMicrotask(() => {
        setErrorMessage(c.sessionError);
        setStage("error");
      });
      return;
    }
    const signals = { name: localizeCocktailRecipe(session.result.recipe, language).name, spirit: session.spirit, flavor: session.flavor };
    queueMicrotask(() => {
      setCocktail(signals);
      setCocktailNumber(getTonightSignalNumber(session.result.recipe.id, session.spirit, session.flavor));
    });
    void service.getAvailability().then((next) => {
      setAvailability(next);
      if (next.onlineCount === 0) setStage("empty");
    }).catch(() => {
      setErrorMessage(c.errorBody);
      setStage("error");
    });
  }, [c.errorBody, c.sessionError, flavor.id, isHydrated, language, service, spirit.id]);

  useEffect(() => {
    if (stage === "intro" || stage === "consent" || stage === "empty" || stage === "ended" || stage === "error") {
      clearCurrentMatchSession();
      return;
    }
    writeCurrentMatchSnapshot({ stage, candidateId: candidate?.id, meetingAreaId: meetingArea?.id });
  }, [candidate?.id, meetingArea?.id, stage]);

  useEffect(() => {
    if (stage !== "five_minute_connection") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          queueMicrotask(() => exitMatchSession());
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [exitMatchSession, stage]);

  const startSearch = useCallback(async (excluded = excludedIds) => {
    const requestId = ++searchRequest.current;
    setStage("searching");
    try {
      const result = await service.findCandidate(excluded);
      if (requestId !== searchRequest.current) return;
      if (result.status === "empty") {
        setStage("empty");
        return;
      }
      setCandidate(result.candidate);
      setStage("candidate");
    } catch {
      if (requestId !== searchRequest.current) return;
      setErrorMessage(c.errorBody);
      setStage("error");
    }
  }, [c.errorBody, excludedIds, service]);

  async function acceptCandidate() {
    if (!candidate) return;
    const requestId = ++acceptanceRequest.current;
    setStage("waiting_for_other");
    try {
      await service.acceptCandidate(candidate.id);
      const accepted = await service.waitForMutualAcceptance(candidate.id);
      if (requestId !== acceptanceRequest.current) return;
      setStage(accepted ? "mutual_match" : "ended");
    } catch {
      if (requestId !== acceptanceRequest.current) return;
      setErrorMessage(c.errorBody);
      setStage("error");
    }
  }

  function passCandidate() {
    if (!candidate) return;
    const nextExcluded = [...excludedIds, candidate.id];
    setExcludedIds(nextExcluded);
    setCandidate(null);
    void service.passCandidate(candidate.id).then(() => startSearch(nextExcluded)).catch(() => {
      setErrorMessage(c.errorBody);
      setStage("error");
    });
  }

  function blockCandidate() {
    if (!candidate) return;
    blockCandidateForTonight(candidate.id);
    const nextExcluded = Array.from(new Set([...excludedIds, candidate.id]));
    setExcludedIds(nextExcluded);
    setCandidate(null);
    void startSearch(nextExcluded);
  }

  function meetSomeoneElse() {
    const nextExcluded = candidate && !excludedIds.includes(candidate.id) ? [...excludedIds, candidate.id] : excludedIds;
    setExcludedIds(nextExcluded);
    setMeetingArea(null);
    setSecondsLeft(300);
    setCandidate(null);
    void startSearch(nextExcluded);
  }

  function cancelSearch(nextStage: MatchStage) {
    searchRequest.current += 1;
    setStage(nextStage);
  }

  async function submitReport() {
    if (!candidate || !reportReason) return;
    await safetyService.submitReport({ candidateId: candidate.id, reason: reportReason, stage, createdAt: new Date().toISOString() });
    setReportResult(c.reportResult);
  }

  const reasons = useMemo(() => candidate && cocktail ? explainMatch(profile, candidate, cocktail) : [], [candidate, cocktail, profile]);
  const openingPrompt = useMemo(() => candidate && cocktail ? createOpeningPrompt(profile, candidate, cocktail) : null, [candidate, cocktail, profile]);
  const candidatePreview = useMemo(() => candidate && openingPrompt ? projectCandidatePreview(candidate, reasons, openingPrompt) : null, [candidate, openingPrompt, reasons]);
  const energy = candidatePreview ? energyOptions.find((item) => item.id === candidatePreview.energy) : null;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  if (!isHydrated || (stage === "intro" && (!cocktail || !availability))) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#070707] px-6"><p className="mixing-copy text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">{c.demo}</p></main>;
  }

  const canGoBack = stage !== "intro" && stage !== "empty" && stage !== "error";
  function handleBack() {
    if (stage === "consent") setStage("intro");
    else if (stage === "candidate") setStage("consent");
    else if (stage === "searching") cancelSearch("consent");
    else if (stage === "meeting_area") { setMeetingArea(null); setStage("mutual_match"); }
    else exitMatchSession();
  }

  return (
    <main data-stage={stage} className="second-match relative min-h-dvh overflow-x-hidden bg-[#080808] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(176,139,101,0.11),transparent_68%)] blur-2xl" />
      <div className="relative mx-auto w-full max-w-md">
        <header className="flex min-h-11 items-center justify-between gap-4">
          {canGoBack ? <button type="button" onClick={handleBack} className="min-h-11 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">← {c.back}</button> : <Link href={drinkHref} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">← {c.keep}</Link>}
          <div className="flex items-center gap-3"><LanguageToggle /><EndTonightControl /><span className="text-[0.56rem] font-semibold uppercase tracking-[0.25em] text-amber-100/45">{language === "zh" ? "second / 相遇" : "second / connection"}</span></div>
        </header>

        <section className="second-stage flex min-h-[calc(100svh-5rem)] flex-col justify-center py-8">
          {stage === "intro" && cocktail ? <>
            <TonightSignal stage="searching" spirit={spirit.id} flavor={flavor.id} cocktailNumber={cocktailNumber} label={language === "zh" ? "一个今晚信号正在寻找另一个信号" : "One tonight signal beginning to search for another"} className="mx-auto max-w-[15rem]" />
            <p className="second-micro mt-5 text-amber-100/58">{c.introEyebrow}</p>
            <h1 className="second-screen-title mt-4 text-stone-100">{c.introTitle}</h1>
            <p className="mt-5 text-sm leading-6 text-white/48">{c.introBody}</p>
            <div className="mt-7 border-y border-white/[0.14] py-5"><p className="second-micro">{language === "zh" ? "今晚的鸡尾酒" : "Tonight’s cocktail"}</p><p className="mt-3 text-xl font-medium tracking-[-0.035em] text-stone-100">{cocktail.name}</p></div>
            <ul className="mt-6 grid gap-2 text-xs leading-5 text-white/50"><li>✓ {c.optional}</li><li>✓ {c.mutual}</li><li>✓ {c.private}</li><li>✓ {c.leave}</li></ul>
            <p className="mt-6 text-center text-[0.58rem] uppercase tracking-[0.18em] text-white/25">{interpolate(c.demoCount, { count: availability?.onlineCount ?? 0 })}</p>
            <button type="button" className={`${primaryButton} mt-4`} onClick={() => setStage("consent")}>{c.continue}</button>
          </> : null}

          {stage === "consent" ? <>
            <p className="second-micro text-amber-100/58">{c.optional}</p>
            <h1 className="second-screen-title mt-5 text-stone-100">{c.consentTitle}</h1>
            <p className="mt-5 text-sm leading-6 text-white/48">{c.consentBody}</p>
            <ul className="mt-5 grid gap-2 text-xs leading-5 text-white/52"><li>✓ {c.mutual}</li><li>✓ {language === "zh" ? "只有双方接受后才会显示见面区域" : "A meeting area appears only after both accept"}</li><li>✓ {c.private}</li><li>✓ {c.leave}</li><li>✓ {language === "zh" ? "离开后，你的鸡尾酒仍会保留" : "Your cocktail stays when you leave"}</li></ul>
            <PrivacySummary className="mt-3 min-h-11 text-xs text-white/45 underline decoration-white/15 underline-offset-4" />
            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.09] p-4"><input checked={hasConsented} className="mt-0.5 h-4 w-4 accent-[#eadfce]" type="checkbox" onChange={(event) => setHasConsented(event.target.checked)} /><span className="text-xs leading-5 text-white/50">{c.consentLabel}</span></label>
            <button type="button" disabled={!hasConsented} className={`${primaryButton} mt-5`} onClick={() => void startSearch()}>{c.start}</button>
          </> : null}

          {stage === "searching" ? <div role="status" aria-live="polite"><TonightSignal stage="searching" spirit={spirit.id} flavor={flavor.id} cocktailNumber={cocktailNumber} label={c.searching} className="mx-auto max-w-[16rem]" /><h1 className="second-screen-title mt-5 text-stone-100">{c.searching}</h1><p className="mt-5 text-sm leading-6 text-white/48">{c.searchingBody}</p><button type="button" className={`${secondaryButton} mt-8`} onClick={() => cancelSearch("intro")}>{c.cancel}</button></div> : null}

          {stage === "empty" ? <>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white/30">{c.demo}</p><h1 className="mt-4 text-[2.7rem] font-medium leading-none tracking-[-0.06em] text-stone-100">{c.emptyTitle}</h1><p className="mt-5 text-sm leading-6 text-white/48">{c.emptyBody}</p>
            <div className="mt-8 grid gap-3"><Link href={drinkHref} className={primaryButton}>{c.keep}</Link><button type="button" className={secondaryButton} onClick={() => setIsStaying(true)}>{c.stay}</button><button type="button" className={secondaryButton} onClick={() => void service.getAvailability().then((next) => next.onlineCount > 0 ? setStage("intro") : setIsStaying(true)).catch(() => setStage("error"))}>{c.retry}</button></div>
            {isStaying ? <p className="mt-4 text-center text-xs text-amber-100/55" role="status">{c.staying}</p> : null}
          </> : null}

          {stage === "candidate" && candidate && candidatePreview ? <>
            <p className="second-micro text-amber-100/58">{c.candidate}</p><h1 className="second-screen-title mt-5 text-stone-100">{candidatePreview.nickname}</h1>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/36">{candidatePreview.age} · {energy ? localizeEnergy(energy.id, energy.label, language) : candidatePreview.energy}</p><p className="mt-4 text-sm leading-6 text-white/62">{language === "zh" ? candidatePreview.personalitySignalZh : candidatePreview.personalitySignal}</p>
            <div className="mt-7 border-y border-white/[0.16] py-6"><p className="second-micro text-amber-100/58">{c.why}</p><ul className="mt-4 space-y-3 text-[1rem] font-medium leading-6 tracking-[-0.02em] text-white/72">{candidatePreview.reasons.map((reason) => <li key={reason.id}>— {reason[language]}</li>)}</ul></div>
            <div className="mt-7 border-l border-amber-100/45 py-2 pl-5"><p className="second-micro text-amber-100/60">{c.opener}</p><p className="mt-3 text-lg font-medium leading-7 tracking-[-0.025em] text-stone-100/88">“{candidatePreview.openingPrompt[language]}”</p></div>
            <div className="mt-7 grid gap-3"><button type="button" className={primaryButton} onClick={() => void acceptCandidate()}>{c.meet}</button><button type="button" className={secondaryButton} onClick={passCandidate}>{c.pass}</button><button type="button" className="min-h-11 text-xs text-white/38 underline decoration-white/15 underline-offset-4" onClick={blockCandidate}>{c.block}</button></div>
          </> : null}

          {stage === "waiting_for_other" && candidate ? <div role="status" aria-live="polite"><p className="mixing-copy text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-amber-100/48">{candidate.nickname}</p><h1 className="mt-5 text-[3rem] font-medium leading-none tracking-[-0.06em] text-stone-100">{c.waiting}</h1><p className="mt-5 text-sm leading-6 text-white/48">{c.waitingBody}</p><button type="button" className={`${secondaryButton} mt-8`} onClick={exitMatchSession}>{c.leaveWaiting}</button></div> : null}

          {stage === "mutual_match" && candidate ? <><TonightSignal stage="mutual" spirit={spirit.id} flavor={flavor.id} cocktailNumber={cocktailNumber} partnerSeed={candidate.id} label={language === "zh" ? "双方信号已汇合，开启五分钟第二幕" : "Both signals have met, opening a five-minute Second Act"} className="mx-auto max-w-[19rem]" /><h1 className="second-title mx-auto mt-7 max-w-[10ch] text-stone-100">{c.mutualTitle}</h1><p className="second-body mx-auto mt-5 max-w-sm">{c.mutualBody}</p><button type="button" className={`${primaryButton} mt-9`} onClick={() => setStage("meeting_area")}>{c.chooseArea}</button></> : null}

          {stage === "meeting_area" && candidate ? <><p className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-amber-100/48">{candidate.nickname}</p><h1 className="mt-4 text-[3rem] font-medium leading-none tracking-[-0.06em] text-stone-100">{c.areaTitle}</h1><p className="mt-5 text-sm leading-6 text-white/48">{c.areaBody}</p><div className="mt-7 grid grid-cols-3 gap-2">{demoVenueAreas.map((area) => <button key={area.id} type="button" aria-pressed={meetingArea?.id === area.id} onClick={() => setMeetingArea(area)} className={`min-h-14 rounded-2xl border px-2 text-xs font-semibold ${meetingArea?.id === area.id ? "border-amber-100/45 bg-amber-100/[0.08] text-amber-50" : "border-white/[0.1] text-white/50"}`}>{language === "zh" ? area.labelZh : area.label}</button>)}</div><button type="button" disabled={!meetingArea} className={`${primaryButton} mt-5`} onClick={() => setStage("five_minute_connection")}>{c.startFive}</button></> : null}

          {stage === "five_minute_connection" && candidate && meetingArea && openingPrompt ? <><div className="relative pr-20"><p className="second-micro text-white/38">{c.connection}</p><h1 className="second-screen-title mt-5 text-stone-100">{candidate.nickname}</h1><p className="mt-3 text-sm font-medium text-white/52">{language === "zh" ? meetingArea.labelZh : meetingArea.label}</p><p className="absolute right-0 top-0 text-sm font-semibold tabular-nums tracking-[-0.02em] text-white/42" role="timer">{minutes}:{seconds}</p></div><div className="my-auto border-l border-amber-100/38 py-2 pl-5"><p className="second-micro text-amber-100/52">{c.opener}</p><p className="mt-3 text-lg font-medium leading-7 tracking-[-0.025em] text-stone-100/82">“{openingPrompt[language]}”</p></div><div className="mt-7 grid grid-cols-2 gap-3"><button type="button" className={secondaryButton} onClick={exitMatchSession}>{c.end}</button><button type="button" className="min-h-12 border border-white/[0.16] text-xs font-semibold text-white/75" onClick={() => setShowHelp(true)}>{c.help}</button><button type="button" className="col-span-2 min-h-11 text-xs font-semibold text-white/65 underline decoration-white/25 underline-offset-4" onClick={() => setShowReport(true)}>{c.report}</button></div></> : null}

          {stage === "ended" ? <><p className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-amber-100/48">{language === "zh" ? "second / 相遇" : "second / connection"}</p><h1 className="mt-4 text-[3rem] font-medium leading-none tracking-[-0.06em] text-stone-100">{c.ended}</h1><p className="mt-5 text-sm leading-6 text-white/48">{c.endedBody}</p><div className="mt-8 grid gap-3"><Link href={drinkHref} className={primaryButton}>{c.keep}</Link><button type="button" className={secondaryButton} onClick={meetSomeoneElse}>{c.meetAnother}</button></div></> : null}

          {stage === "error" ? <><p className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white/30">{c.demo}</p><h1 className="mt-4 text-[2.7rem] font-medium leading-none tracking-[-0.06em] text-stone-100">{c.error}</h1><p className="mt-5 text-sm leading-6 text-white/48">{errorMessage || c.errorBody}</p><div className="mt-8 grid gap-3"><Link href={drinkHref} className={primaryButton}>{c.keep}</Link><button type="button" className={secondaryButton} onClick={() => window.location.reload()}>{c.retry}</button></div></> : null}
        </section>
      </div>

      {showHelp ? <div className="fixed inset-0 z-50 flex items-end bg-black/75 p-5 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="w-full max-w-sm rounded-[1.5rem] border border-white/[0.1] bg-[#111] p-6"><h2 id="help-title" className="text-xl font-medium text-stone-100">{c.helpTitle}</h2><p className="mt-3 text-sm leading-6 text-white/48">{c.helpBody}</p><p className="mt-4 rounded-2xl border border-amber-100/[0.12] bg-amber-100/[0.04] p-4 text-sm font-semibold text-amber-50/80">{c.findStaff}</p><div className="mt-6 grid gap-3"><button type="button" className={primaryButton} onClick={() => { setShowHelp(false); exitMatchSession(); }}>{c.leaveNow}</button><button type="button" className={secondaryButton} onClick={() => setShowHelp(false)}>{c.close}</button></div></div></div> : null}
      {showReport ? <div className="fixed inset-0 z-50 flex items-end bg-black/75 p-5 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="report-title"><div className="w-full max-w-sm rounded-[1.5rem] border border-white/[0.1] bg-[#111] p-6"><h2 id="report-title" className="text-xl font-medium text-stone-100">{c.reportTitle}</h2><p className="mt-3 text-sm leading-6 text-white/48">{reportResult || c.reportBody}</p>{!reportResult ? <><fieldset className="mt-5 grid gap-2"><legend className="sr-only">{c.reportTitle}</legend>{([ ["unsafe", c.reportUnsafe], ["harassment", c.reportHarassment], ["identity_mismatch", c.reportIdentity], ["other", c.reportOther] ] as const).map(([value, label]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.09] px-4"><input type="radio" name="report-reason" value={value} checked={reportReason === value} onChange={() => setReportReason(value)} className="accent-[#eadfce]" /><span className="text-xs text-white/60">{label}</span></label>)}</fieldset><button type="button" disabled={!reportReason} className={`${primaryButton} mt-6`} onClick={() => void submitReport()}>{c.submitReport}</button></> : null}<button type="button" autoFocus={Boolean(reportResult)} className={`${secondaryButton} mt-3`} onClick={() => { setShowReport(false); setReportReason(""); setReportResult(""); }}>{c.close}</button></div></div> : null}
    </main>
  );
}
