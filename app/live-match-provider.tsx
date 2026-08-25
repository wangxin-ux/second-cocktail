"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSecondProfile } from "@/lib/second/use-second-profile";
import { readCookieValue, writeTemporaryCookie } from "@/lib/second/profile";
import { useI18n } from "@/lib/i18n";
import PostTalkExperience, { type GiftDrink, type SocialSurvey } from "./post-talk-experience";

export type LivePartner = { name: string; age?: number; heightCm?: number };
export type LivePhase = "offline" | "connecting" | "online" | "waiting" | "request" | "pending" | "talk" | "survey";

type LiveMatchValue = {
  eligible: boolean;
  phase: LivePhase;
  partner: LivePartner | null;
  role: "approacher" | "target" | null;
  meetingLocation: string;
  remaining: number;
  waitingSeconds: number;
  notice: string;
  gift: GiftDrink | null;
  giftFrom: string;
  surveySubmitted: boolean;
  partnerAccepted: boolean;
  setDefaultAvailable: (available: boolean) => void;
  accept: () => void;
  decline: () => void;
  submitSurvey: (survey: SocialSurvey) => void;
  finishSurvey: () => void;
};

const LiveMatchContext = createContext<LiveMatchValue | null>(null);
const clientIdKey = "second_live_client_v1";

function websocketUrl() { return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`; }
function getClientId() {
  const saved = readCookieValue(clientIdKey);
  if (saved) return saved;
  const value = crypto.randomUUID();
  writeTemporaryCookie(clientIdKey, value);
  return value;
}

export function useLiveMatch() {
  const value = useContext(LiveMatchContext);
  if (!value) throw new Error("useLiveMatch must be used inside LiveMatchProvider");
  return value;
}

export default function LiveMatchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routePath = (pathname || "/").replace(/\/+$/, "") || "/";
  const { profile, isHydrated } = useSecondProfile();
  const { language } = useI18n();
  const eligible = Boolean(profile.nickname && profile.age && profile.heightCm && profile.meetingLocation);
  const [phase, setPhase] = useState<LivePhase>("offline");
  const [partner, setPartner] = useState<LivePartner | null>(null);
  const [role, setRole] = useState<"approacher" | "target" | null>(null);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [endsAt, setEndsAt] = useState(0);
  const [waitingSince, setWaitingSince] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const [gift, setGift] = useState<GiftDrink | null>(null);
  const [giftFrom, setGiftFrom] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [partnerAccepted, setPartnerAccepted] = useState(false);
  const [defaultAvailable, setDefaultAvailable] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const mode = useRef<"active" | "passive" | "inactive">("inactive");
  const finished = useRef(false);

  useEffect(() => {
    mode.current = routePath === "/social-talk" ? "active" : routePath === "/match" && defaultAvailable ? "passive" : "inactive";
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "set_mode", mode: mode.current }));
    }
  }, [defaultAvailable, routePath]);

  useEffect(() => {
    if (!isHydrated || !eligible) { setPhase("offline"); return; }
    let cancelled = false;
    let retryTimer = 0;
    const connect = () => {
      if (cancelled) return;
      setPhase((current) => ["request", "pending", "talk", "survey"].includes(current) ? current : "connecting");
      const ws = new WebSocket(websocketUrl());
      socket.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({
        type: "join",
        protocolVersion: 2,
        mode: mode.current,
        clientId: getClientId(),
        person: { name: profile.nickname, age: profile.age, heightCm: profile.heightCm, location: profile.meetingLocation },
      }));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as { type: string; partner?: LivePartner; role?: "approacher" | "target"; endsAt?: number; queuedAt?: number; meetingLocation?: string; drink?: GiftDrink; from?: string };
        if (data.type === "online") setPhase("online");
        if (data.type === "inactive") setPhase("offline");
        if (data.type === "waiting") { setWaitingSince(data.queuedAt ?? Date.now()); setPhase("waiting"); }
        if (data.type === "matched") { setPartner(data.partner ?? null); setRole("approacher"); setPartnerAccepted(false); setPhase("pending"); }
        if (data.type === "approach_request") { setPartner(data.partner ?? null); setRole("target"); setPartnerAccepted(false); setPhase("request"); }
        if (data.type === "partner_accepted") setPartnerAccepted(true);
        if (data.type === "approach_declined" || data.type === "approach_timeout") setNotice(language === "zh" ? "对方暂时没有同意，已继续为你寻找。" : "They passed for now. You are back in the queue.");
        if (data.type === "talk_started") {
          setPartner(data.partner ?? null); setRole(data.role ?? null); setMeetingLocation(data.meetingLocation ?? "");
          setGift(null); setGiftFrom(""); setSurveySubmitted(false); setPartnerAccepted(false);
          setEndsAt(data.endsAt ?? 0); finished.current = false; setPhase("talk");
        }
        if (data.type === "talk_ended") setPhase("survey");
        if (data.type === "survey_saved") setSurveySubmitted(true);
        if (data.type === "drink_gift" && data.drink) { setGift(data.drink); setGiftFrom(data.from ?? ""); }
        if (data.type === "partner_left") {
          setNotice(language === "zh" ? "对方已离开，本次连接已结束。" : "They left. This connection has ended.");
          setPartner(null); setRole(null); setMeetingLocation("");
          setPhase(mode.current === "active" ? "waiting" : mode.current === "passive" ? "online" : "offline");
        }
        if (data.type === "profile_incomplete") setPhase("offline");
      };
      ws.onclose = (event) => {
        if (socket.current === ws) socket.current = null;
        if (event.code === 4001) { cancelled = true; return; }
        if (!cancelled) { setPhase((current) => ["waiting", "request", "pending", "talk", "survey"].includes(current) ? current : "offline"); retryTimer = window.setTimeout(connect, 1200); }
      };
    };
    connect();
    return () => { cancelled = true; window.clearTimeout(retryTimer); socket.current?.close(); socket.current = null; };
  }, [eligible, isHydrated, profile.age, profile.heightCm, profile.meetingLocation, profile.nickname]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const waitingSeconds = phase === "waiting" && waitingSince ? Math.max(0, Math.floor((now - waitingSince) / 1000)) : 0;
  useEffect(() => {
    if (phase === "talk" && endsAt && remaining === 0 && !finished.current) {
      finished.current = true; socket.current?.send(JSON.stringify({ type: "finish" })); setPhase("survey");
    }
  }, [endsAt, phase, remaining]);

  const accept = () => { socket.current?.send(JSON.stringify({ type: "accept" })); setPhase("pending"); };
  const idlePhase = () => mode.current === "active" ? "waiting" : mode.current === "passive" ? "online" : "offline";
  const decline = () => { socket.current?.send(JSON.stringify({ type: "decline" })); setPartner(null); setRole(null); setPartnerAccepted(false); setPhase(idlePhase()); };
  const submitSurvey = (survey: SocialSurvey) => { setSurveySubmitted(true); socket.current?.send(JSON.stringify({ type: "survey_submit", survey })); };
  const finishSurvey = () => { socket.current?.send(JSON.stringify({ type: "rejoin" })); setPartner(null); setRole(null); setMeetingLocation(""); setGift(null); setGiftFrom(""); setSurveySubmitted(false); setPhase(idlePhase()); };

  const value = useMemo<LiveMatchValue>(() => ({ eligible, phase, partner, role, meetingLocation, remaining, waitingSeconds, notice, gift, giftFrom, surveySubmitted, partnerAccepted, setDefaultAvailable, accept, decline, submitSurvey, finishSurvey }), [eligible, gift, giftFrom, meetingLocation, notice, partner, partnerAccepted, phase, remaining, role, surveySubmitted, waitingSeconds]);
  const showGlobal = routePath !== "/social-talk" && ["request", "pending", "talk", "survey"].includes(phase);
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return <LiveMatchContext.Provider value={value}>
    {children}
    {showGlobal && <div className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-sm ${phase === "talk" ? "p-0" : "px-5"}`}>
      <section className={phase === "talk" ? "flex min-h-dvh w-full flex-col items-center justify-center bg-[#080808] px-6 text-center text-stone-100" : "max-h-[92svh] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-amber-100/[0.16] bg-[#11100e] p-6 text-stone-100 shadow-2xl"}>
        {phase === "request" && <>
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-amber-100/55">{role === "target" ? (language === "zh" ? "有人想认识你" : "Someone approached you") : (language === "zh" ? "找到一个人" : "Someone found")}</p>
          <h2 className="mt-4 text-4xl font-medium tracking-[-0.07em]">{partner?.name}</h2>
          <p className="mt-3 text-sm text-white/48">{language === "zh" ? `${partner?.age ?? "—"} 岁 · ${partner?.heightCm ?? "—"} cm` : `Age ${partner?.age ?? "—"} · ${partner?.heightCm ?? "—"} cm`}</p>
          <p className="mt-5 text-sm leading-6 text-white/52">{partnerAccepted ? (language === "zh" ? "对方已同意，等待你的确认。" : "They agreed. Waiting for you.") : (language === "zh" ? "双方都同意后，才会显示被搭讪者的位置并开始五分钟。" : "The five minutes and approached person’s location appear only after both agree.")}</p>
          <div className="mt-7 grid grid-cols-2 gap-3"><button onClick={decline} className="min-h-13 rounded-full border border-white/15 text-sm text-white/55">{language === "zh" ? "暂不接受" : "Not now"}</button><button onClick={accept} className="min-h-13 rounded-full bg-stone-100 text-sm font-semibold text-black">{language === "zh" ? "同意搭讪" : "Accept"}</button></div>
        </>}
        {phase === "pending" && <><p className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-amber-100/55">{language === "zh" ? "匹配成功" : "Match found"}</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.07em]">{partner?.name}</h2><p className="mt-5 text-sm leading-6 text-white/52">{language === "zh" ? "等待被搭讪者同意。" : "Waiting for them to accept."}</p></>}
        {phase === "talk" && <><p className="text-[clamp(6rem,28vw,12rem)] font-medium leading-none tracking-[-0.1em] text-amber-100">{clock}</p><p className="mt-14 max-w-3xl text-[clamp(2.4rem,11vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.07em] text-white">{meetingLocation || "—"}</p></>}
        {phase === "survey" && <PostTalkExperience compact language={language} partnerName={partner?.name} gift={gift} giftFrom={giftFrom} submitted={surveySubmitted} onSubmit={submitSurvey} onDone={finishSurvey} />}
      </section>
    </div>}
  </LiveMatchContext.Provider>;
}
