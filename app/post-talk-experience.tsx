"use client";

import { useState } from "react";

export type GiftDrink = { id: string; nameZh: string; nameEn: string; baseZh: string; baseEn: string; noteZh: string; noteEn: string; cultureZh?: string; cultureEn?: string; category?: string };
export type SocialSurvey = { impression: string; vibe: string; again: string };

type Props = {
  language: "zh" | "en";
  partnerName?: string;
  gift: GiftDrink | null;
  submitted: boolean;
  onSubmit: (survey: SocialSurvey) => void;
  onDone: () => void;
  onEnd: () => void;
  compact?: boolean;
};

export default function PostTalkExperience({ language, partnerName, gift, submitted, onSubmit, onDone, onEnd, compact = false }: Props) {
  const [stage, setStage] = useState<"decision" | "survey" | "rematch">("decision");
  const [impression, setImpression] = useState("");
  const [vibe, setVibe] = useState("");
  const [again, setAgain] = useState("");
  const zh = language === "zh";
  const optionClass = (selected: boolean) => `min-h-11 rounded-full border px-3 text-xs transition-colors ${selected ? "border-amber-100/55 bg-amber-100/15 text-amber-50" : "border-white/12 text-white/48"}`;

  if (submitted && gift) return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">SECOND · CULTURE CARD</p>
    <p className="mt-4 text-xs leading-5 text-white/42">{zh ? "根据你留下的印象，酒文化库为这位刚认识的灵魂翻出一张酒卡。" : "From the impression you left, the cocktail culture archive drew this card for the soul you just met."}</p>
    <article className="relative mt-7 overflow-hidden rounded-[1.75rem] border border-amber-100/25 bg-[#0b0a08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div aria-hidden="true" className="absolute -right-16 -top-20 h-48 w-48 rounded-full border border-amber-100/10 bg-[radial-gradient(circle,rgba(253,230,138,0.14),transparent_68%)]" />
      <div className="relative flex items-start justify-between gap-4 border-b border-white/[0.1] pb-5">
        <div><p className="text-[0.48rem] font-semibold uppercase tracking-[0.3em] text-amber-100/45">IBA COCKTAIL ARCHIVE</p><p className="mt-2 text-[0.58rem] uppercase tracking-[0.18em] text-white/28">{gift.category || "Cocktail culture"}</p></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-100/25 text-lg text-amber-100/75">✦</div>
      </div>
      <div className="relative py-7">
        <p className="text-[0.55rem] uppercase tracking-[0.28em] text-white/30">{gift.nameEn}</p>
        <h2 className={`${compact ? "text-4xl" : "text-5xl"} mt-2 font-medium leading-[0.9] tracking-[-0.08em] text-stone-100`}>{zh ? gift.nameZh : gift.nameEn}</h2>
        <p className="mt-5 text-[0.62rem] font-semibold uppercase leading-5 tracking-[0.16em] text-amber-100/52">{zh ? gift.baseZh : gift.baseEn}</p>
      </div>
      <div className="relative border-t border-white/[0.1] pt-5">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.26em] text-white/28">{zh ? "酒文化档案" : "Culture note"}</p>
        <p className="mt-3 text-sm leading-6 text-white/58">{zh ? gift.cultureZh : gift.cultureEn}</p>
        <p className="mt-5 border-l border-amber-100/30 pl-4 text-sm leading-6 text-amber-50/72">{zh ? gift.noteZh : gift.noteEn}</p>
      </div>
    </article>
    <button onClick={onDone} className="mt-7 min-h-13 w-full rounded-full bg-stone-100 text-sm font-semibold text-black">{zh ? "收下这张酒卡，继续在线" : "Keep this card and stay online"}</button>
  </div>;

  if (submitted) return <div className="py-6 text-center">
    <div className="mx-auto h-16 w-16 rounded-full border border-amber-100/20 bg-[radial-gradient(circle,rgba(253,230,138,0.22),transparent_66%)]" />
    <h2 className="mt-6 text-3xl font-medium tracking-[-0.06em]">{zh ? "正在从酒文化库翻一张酒卡。" : "Drawing a card from the cocktail culture archive."}</h2>
    <p className="mt-4 text-sm leading-6 text-white/45">{zh ? "无需等待对方，结果马上出现。" : "No need to wait for the other person. Your result is on its way."}</p>
  </div>;

  if (stage === "decision") return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">FIVE MINUTES LATER</p>
    <h2 className={`${compact ? "text-4xl" : "text-5xl"} mt-4 font-medium leading-[0.92] tracking-[-0.07em]`}>{zh ? "还想继续认识彼此吗？" : "Would you like to keep talking?"}</h2>
    <p className="mt-5 text-sm leading-6 text-white/48">{zh ? `五分钟结束了。现在由你决定，是否继续认识 ${partnerName || "对方"}。` : `The five minutes are over. You decide whether to keep getting to know ${partnerName || "them"}.`}</p>
    <div className="mt-8 grid grid-cols-2 gap-3">
      <button onClick={() => setStage("rematch")} className="min-h-13 rounded-full border border-white/15 text-sm text-white/58">{zh ? "否，先不继续" : "No, not this time"}</button>
      <button onClick={() => setStage("survey")} className="min-h-13 rounded-full bg-stone-100 text-sm font-semibold text-black">{zh ? "是，继续认识" : "Yes, keep talking"}</button>
    </div>
  </div>;

  if (stage === "rematch") return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">ONE MORE CHANCE</p>
    <h2 className={`${compact ? "text-4xl" : "text-5xl"} mt-4 font-medium leading-[0.92] tracking-[-0.07em]`}>{zh ? "还要继续等待配对吗？" : "Wait for another match?"}</h2>
    <p className="mt-5 text-sm leading-6 text-white/48">{zh ? "你可以回到等待队列，也可以带着今晚的故事离开。" : "Return to the queue, or leave with tonight’s story."}</p>
    <div className="mt-8 space-y-3">
      <button onClick={onDone} className="min-h-13 w-full rounded-full bg-stone-100 text-sm font-semibold text-black">{zh ? "是，继续等待" : "Yes, keep matching"}</button>
      <button onClick={onEnd} className="min-h-13 w-full rounded-full border border-white/15 text-sm text-white/58">{zh ? "否，结束今晚" : "No, end tonight"}</button>
    </div>
  </div>;

  const impressions = zh ? [["warm", "温暖"], ["mysterious", "神秘"], ["bright", "明亮"], ["calm", "安静"], ["bold", "大胆"], ["playful", "有趣"]] : [["warm", "Warm"], ["mysterious", "Mysterious"], ["bright", "Bright"], ["calm", "Calm"], ["bold", "Bold"], ["playful", "Playful"]];
  const vibes = zh ? [["easy", "轻松"], ["deep", "深入"], ["playful", "好玩"]] : [["easy", "Easy"], ["deep", "Deep"], ["playful", "Playful"]];
  const agains = zh ? [["yes", "愿意"], ["maybe", "也许"], ["no", "不了"]] : [["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]];

  return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">PERFECT MATCH</p>
    <h2 className={`${compact ? "text-3xl" : "text-5xl"} mt-4 font-medium leading-[0.94] tracking-[-0.07em]`}>{zh ? "恭喜你们完成配对。" : "You completed the match."}</h2>
    <p className="mt-4 text-sm leading-6 text-white/48">{zh ? `今晚属于你们。根据你对 ${partnerName || "对方"} 的印象，再为这位刚认识的灵魂点一杯酒。` : `Tonight is yours. Order one more drink for the person you just met, based on your impression.`}</p>
    <div className="mt-7 space-y-6">
      <fieldset><legend className="text-xs text-white/42">{zh ? "第一印象" : "First impression"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{impressions.map(([value, label]) => <button type="button" key={value} onClick={() => setImpression(value)} className={optionClass(impression === value)}>{label}</button>)}</div></fieldset>
      <fieldset><legend className="text-xs text-white/42">{zh ? "聊天的感觉" : "Conversation energy"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{vibes.map(([value, label]) => <button type="button" key={value} onClick={() => setVibe(value)} className={optionClass(vibe === value)}>{label}</button>)}</div></fieldset>
      <fieldset><legend className="text-xs text-white/42">{zh ? "还愿意见面吗？" : "Meet again?"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{agains.map(([value, label]) => <button type="button" key={value} onClick={() => setAgain(value)} className={optionClass(again === value)}>{label}</button>)}</div></fieldset>
    </div>
    <button disabled={!impression || !vibe || !again} onClick={() => onSubmit({ impression, vibe, again })} className="mt-7 min-h-13 w-full rounded-full bg-stone-100 text-sm font-semibold text-black disabled:bg-white/8 disabled:text-white/25">{zh ? "用这份印象，为对方调一杯" : "Turn this impression into their drink"}</button>
  </div>;
}
