"use client";

import Link from "next/link";
import LanguageToggle from "../language-toggle";
import { useI18n } from "@/lib/i18n";
import { useLiveMatch } from "../live-match-provider";
import PostTalkExperience from "../post-talk-experience";

export default function SocialTalkPage() {
  const { language } = useI18n();
  const { eligible, phase, partner, meetingLocation, remaining, waitingSeconds, notice, gift, giftFrom, surveySubmitted, accept, decline, submitSurvey, finishSurvey } = useLiveMatch();
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const waitClock = `${Math.floor(waitingSeconds / 60)}:${String(waitingSeconds % 60).padStart(2, "0")}`;
  const connectionPending = phase === "offline" || phase === "connecting";

  if (eligible && phase === "talk") return <main className="flex min-h-dvh flex-col items-center justify-center bg-[#080808] px-6 text-center text-stone-100">
    <p className="text-[clamp(6rem,28vw,12rem)] font-medium leading-none tracking-[-0.1em] text-amber-100">{clock}</p>
    <p className="mt-14 max-w-3xl text-[clamp(2.4rem,11vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.07em] text-white">{meetingLocation || "—"}</p>
  </main>;

  return <main className="min-h-dvh bg-[#080808] px-5 pb-8 pt-5 text-stone-100 sm:px-6">
    <div className="mx-auto w-full max-w-md">
      <header className="flex min-h-11 items-center justify-between"><Link href="/match" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">← {language === "zh" ? "你的酒" : "Your drink"}</Link><LanguageToggle /></header>

      {!eligible ? <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">{language === "zh" ? "加入之前" : "Before you join"}</p>
        <h1 className="mt-4 text-5xl font-medium leading-[0.95] tracking-[-0.07em]">{language === "zh" ? "先把见面信息填完整。" : "Complete your meeting details."}</h1>
        <p className="mt-5 text-sm leading-6 text-white/48">{language === "zh" ? "昵称、年龄、身高和具体位置完整后，你会保持在线，也可能收到别人的搭讪。" : "Add your name, age, height and location. Then you stay available and may receive an approach."}</p>
        <Link href="/profile" className="mt-8 flex min-h-14 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-black">{language === "zh" ? "填写资料" : "Complete profile"}</Link>
      </section> : phase === "survey" ? <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center py-10">
        <PostTalkExperience language={language} partnerName={partner?.name} gift={gift} giftFrom={giftFrom} submitted={surveySubmitted} onSubmit={submitSurvey} onDone={finishSurvey} />
      </section> : <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">{connectionPending ? (language === "zh" ? "连接现场" : "Connecting") : phase === "request" ? (language === "zh" ? "有人搭讪你" : "Incoming approach") : (language === "zh" ? "主动匹配" : "Active matching")}</p>
        <h1 className="mt-4 text-5xl font-medium leading-[0.95] tracking-[-0.07em]">{connectionPending ? (language === "zh" ? "正在连接，尚未进入匹配。" : "Connecting — not in the queue yet.") : phase === "request" ? (language === "zh" ? `${partner?.name ?? "有人"} 想认识你。` : `${partner?.name ?? "Someone"} wants to meet.`) : phase === "pending" ? (language === "zh" ? "匹配成功。" : "Match found.") : (language === "zh" ? "正在寻找今晚的人。" : "Looking for someone tonight.")}</h1>
        <p className="mt-5 text-sm leading-6 text-white/48">{connectionPending ? (language === "zh" ? "显示“正在寻找”后，才代表已经进入匹配队列。" : "You are in the queue only after this changes to “Looking”.") : phase === "request" ? (language === "zh" ? "你是被搭讪者。同意后，你的位置会显示给双方并开始五分钟倒计时。" : "You are being approached. Accept to share your location with both sides and start five minutes.") : phase === "pending" ? (language === "zh" ? `${partner?.name ?? "对方"} 正在决定；位置尚未公开。` : `${partner?.name ?? "They"} are deciding. The location is still private.`) : waitingSeconds >= 90 ? (language === "zh" ? "已扩大到图 1 结果页，同时继续优先匹配正在排队的人。" : "Now also checking the result page, while still prioritizing active matchers.") : (language === "zh" ? "优先匹配同样正在排队的人；等待满 1:30 后才扩大到图 1 结果页。" : "Prioritizing active matchers. The result page joins the search after 1:30.")}</p>
        {phase === "waiting" && <div className="mt-9 border-y border-white/[0.1] py-7 text-center"><p className="text-[4.8rem] font-medium leading-none tracking-[-0.09em] text-amber-100">{waitClock}</p><p className="mt-3 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/30">{waitingSeconds >= 90 ? (language === "zh" ? "已扩大匹配范围" : "Search expanded") : (language === "zh" ? "匹配等待时长" : "Time waiting")}</p></div>}
        {(phase === "request" || phase === "pending") && <div className="mt-8 rounded-[1.75rem] border border-white/[0.1] bg-white/[0.035] p-5">
          <h2 className="text-3xl font-medium tracking-[-0.06em]">{partner?.name}</h2>
          <p className="mt-3 text-sm text-white/45">{language === "zh" ? `${partner?.age ?? "—"} 岁 · ${partner?.heightCm ?? "—"} cm` : `Age ${partner?.age ?? "—"} · ${partner?.heightCm ?? "—"} cm`}</p>
          {phase === "request" && <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={decline} className="min-h-13 rounded-full border border-white/15 text-sm text-white/55">{language === "zh" ? "拒绝" : "Decline"}</button><button onClick={accept} className="min-h-13 rounded-full bg-stone-100 text-sm font-semibold text-black">{language === "zh" ? "同意搭讪" : "Accept"}</button></div>}
        </div>}
        {notice && <p className="mt-6 text-xs leading-5 text-amber-100/55">{notice}</p>}
      </section>}
    </div>
  </main>;
}
