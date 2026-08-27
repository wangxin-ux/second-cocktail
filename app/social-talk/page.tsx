"use client";

import Link from "next/link";
import LanguageToggle from "../language-toggle";
import { useI18n } from "@/lib/i18n";
import { useLiveMatch } from "../live-match-provider";
import PostTalkExperience from "../post-talk-experience";

export default function SocialTalkPage() {
  const { language } = useI18n();
  const { eligible, phase, partner, meetingLocation, remaining, waitingSeconds, notice, gift, surveySubmitted, accept, decline, submitSurvey, finishSurvey, endNight } = useLiveMatch();
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const waitClock = `${Math.floor(waitingSeconds / 60)}:${String(waitingSeconds % 60).padStart(2, "0")}`;
  const connectionPending = phase === "offline" || phase === "connecting";

  if (eligible && phase === "talk") return <main className="flex min-h-dvh flex-col items-center justify-center bg-[#080808] px-6 text-center text-stone-100">
    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">{language === "zh" ? "你的灵魂正在等待碰撞" : "Two souls are about to meet"}</p>
    <p className="mt-6 text-[clamp(6rem,28vw,12rem)] font-medium leading-none tracking-[-0.1em] text-amber-100">{clock}</p>
    <p className="mt-12 max-w-3xl text-[clamp(2.4rem,11vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.07em] text-white">{meetingLocation || "—"}</p>
    <p className="mt-10 max-w-xl text-base leading-7 text-white/52">{language === "zh" ? "请在五分钟内找到彼此，并根据提示的话题开始认识。五分钟结束后，你们都可以选择继续或离开。" : "Find each other within five minutes and begin with the prompt. When time ends, either of you may continue or leave."}</p>
  </main>;

  return <main className="min-h-dvh bg-[#080808] px-5 pb-8 pt-5 text-stone-100 sm:px-6">
    <div className="mx-auto w-full max-w-md">
      <header className="flex min-h-11 items-center justify-between"><Link href="/match" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">← {language === "zh" ? "你的酒" : "Your drink"}</Link><LanguageToggle /></header>

      {!eligible ? <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">{language === "zh" ? "加入之前" : "Before you join"}</p>
        <h1 className="mt-4 text-5xl font-medium leading-[0.95] tracking-[-0.07em]">{language === "zh" ? "先把见面信息填完整。" : "Complete your meeting details."}</h1>
        <p className="mt-5 text-sm leading-6 text-white/48">{language === "zh" ? "昵称、年龄、身高和具体位置完整后，你会保持在线，也可能收到别人的搭讪。" : "Add your name, age, height and location. Then you stay available and may receive an approach."}</p>
        <Link href="/profile" className="mt-8 flex min-h-14 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-black">{language === "zh" ? "填写资料" : "Complete profile"}</Link>
      </section> : phase === "goodbye" ? <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center text-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">GOOD NIGHT</p>
        <h1 className="mt-5 text-5xl font-medium leading-[0.92] tracking-[-0.07em]">{language === "zh" ? "祝你有一个美好的夜晚。" : "Have a beautiful night."}</h1>
        <p className="mt-5 text-sm leading-6 text-white/45">{language === "zh" ? "今晚的故事先到这里。下一杯，再见。" : "Tonight’s story ends here. See you over the next drink."}</p>
        <Link href="/" className="mt-9 flex min-h-14 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/65">{language === "zh" ? "回到首页" : "Back home"}</Link>
      </section> : phase === "survey" ? <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center py-10">
        <PostTalkExperience language={language} partnerName={partner?.name} gift={gift} submitted={surveySubmitted} onSubmit={submitSurvey} onDone={finishSurvey} onEnd={endNight} />
      </section> : <section className="flex min-h-[calc(100svh-5rem)] flex-col justify-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.34em] text-amber-100/52">{connectionPending ? (language === "zh" ? "连接现场" : "Connecting") : phase === "request" || phase === "pending" ? (language === "zh" ? "匹配确认" : "Match confirmation") : (language === "zh" ? "等待匹配" : "Waiting page")}</p>
        <h1 className="mt-4 text-5xl font-medium leading-[0.95] tracking-[-0.07em]">{connectionPending ? (language === "zh" ? "正在连接，尚未进入匹配。" : "Connecting — not in the queue yet.") : phase === "request" ? (language === "zh" ? "你们愿意见面吗？" : "Would you like to meet?") : phase === "pending" ? (language === "zh" ? "已同意，等待对方。" : "Accepted. Waiting for them.") : (language === "zh" ? "你的灵魂正在等待碰撞。" : "Your soul is waiting to collide.")}</h1>
        <p className="mt-5 text-sm leading-6 text-white/48">{connectionPending ? (language === "zh" ? "显示等待计时器后，才代表已经进入匹配队列。" : "You are in the queue when the waiting timer appears.") : phase === "request" ? (language === "zh" ? "你和对方都已进入匹配。双方都需要选择同意或拒绝；只有双方都同意，才会开始五分钟。" : "Both of you joined matching. Each person must accept or decline; five minutes start only after both accept.") : phase === "pending" ? (language === "zh" ? "现在仍是确认阶段，五分钟倒计时尚未开始。" : "This is still confirmation. The five-minute countdown has not started.") : (language === "zh" ? "只会匹配同样进入等待页的人。计时器持续记录你的等待时长。" : "You can only meet someone who also entered the waiting page. This timer records how long you have waited.")}</p>
        {phase === "waiting" && <div className="mt-9 border-y border-white/[0.1] py-7 text-center"><p className="text-[4.8rem] font-medium leading-none tracking-[-0.09em] text-amber-100">{waitClock}</p><p className="mt-3 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/30">{language === "zh" ? "匹配等待时长" : "Time waiting"}</p></div>}
        {(phase === "request" || phase === "pending") && <div className="mt-8 rounded-[1.75rem] border border-white/[0.1] bg-white/[0.035] p-5">
          <h2 className="text-3xl font-medium tracking-[-0.06em]">{partner?.name}</h2>
          <p className="mt-3 text-sm text-white/45">{language === "zh" ? `${partner?.age ?? "—"} 岁 · ${partner?.heightCm ?? "—"} cm` : `Age ${partner?.age ?? "—"} · ${partner?.heightCm ?? "—"} cm`}</p>
          {phase === "request" && <div className="mt-6 grid grid-cols-2 gap-3"><button onClick={decline} className="min-h-13 rounded-full border border-white/15 text-sm text-white/55">{language === "zh" ? "拒绝" : "Decline"}</button><button onClick={accept} className="min-h-13 rounded-full bg-stone-100 text-sm font-semibold text-black">{language === "zh" ? "同意匹配" : "Accept match"}</button></div>}
          {phase === "pending" && <><p className="mt-5 text-sm leading-6 text-white/45">{language === "zh" ? "对方同意后，双方才会进入五分钟寻找。" : "Both of you enter the five-minute search only after they accept."}</p><button onClick={decline} className="mt-6 min-h-13 w-full rounded-full border border-white/15 text-sm text-white/55">{language === "zh" ? "取消本次匹配" : "Cancel this match"}</button></>}
        </div>}
        {notice && <p className="mt-6 text-xs leading-5 text-amber-100/55">{notice}</p>}
      </section>}
    </div>
  </main>;
}
