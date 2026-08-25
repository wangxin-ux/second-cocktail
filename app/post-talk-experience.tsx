"use client";

import { useState } from "react";

export type GiftDrink = { id: string; nameZh: string; nameEn: string; baseZh: string; baseEn: string; noteZh: string; noteEn: string };
export type SocialSurvey = { impression: string; vibe: string; again: string };

type Props = {
  language: "zh" | "en";
  partnerName?: string;
  gift: GiftDrink | null;
  giftFrom: string;
  submitted: boolean;
  onSubmit: (survey: SocialSurvey) => void;
  onDone: () => void;
  compact?: boolean;
};

export default function PostTalkExperience({ language, partnerName, gift, giftFrom, submitted, onSubmit, onDone, compact = false }: Props) {
  const [impression, setImpression] = useState("");
  const [vibe, setVibe] = useState("");
  const [again, setAgain] = useState("");
  const zh = language === "zh";
  const optionClass = (selected: boolean) => `min-h-11 rounded-full border px-3 text-xs transition-colors ${selected ? "border-amber-100/55 bg-amber-100/15 text-amber-50" : "border-white/12 text-white/48"}`;

  if (submitted && gift) return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">SECOND POUR</p>
    <p className="mt-5 text-xs text-white/38">{zh ? `${giftFrom || "对方"} 根据对你的印象，为你选了` : `${giftFrom || "Your match"} chose this from their impression of you`}</p>
    <h2 className={`${compact ? "text-5xl" : "text-6xl"} mt-3 font-medium leading-[0.88] tracking-[-0.08em] text-stone-100`}>{zh ? gift.nameZh : gift.nameEn}</h2>
    <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-amber-100/48">{zh ? gift.baseZh : gift.baseEn}</p>
    <p className="mt-5 text-sm leading-6 text-white/52">{zh ? gift.noteZh : gift.noteEn}</p>
    <button onClick={onDone} className="mt-8 min-h-13 w-full rounded-full bg-stone-100 text-sm font-semibold text-black">{zh ? "收下这杯，继续在线" : "Keep this drink and stay online"}</button>
  </div>;

  if (submitted) return <div className="py-6 text-center">
    <div className="mx-auto h-16 w-16 rounded-full border border-amber-100/20 bg-[radial-gradient(circle,rgba(253,230,138,0.22),transparent_66%)]" />
    <h2 className="mt-6 text-3xl font-medium tracking-[-0.06em]">{zh ? "你的印象正在变成一杯酒。" : "Your impression is becoming a drink."}</h2>
    <p className="mt-4 text-sm leading-6 text-white/45">{zh ? "已送给对方；等对方完成问卷，你也会收到一杯。" : "It has been sent. You’ll receive yours when they finish too."}</p>
  </div>;

  const impressions = zh ? [["warm", "温暖"], ["mysterious", "神秘"], ["bright", "明亮"], ["calm", "安静"], ["bold", "大胆"], ["playful", "有趣"]] : [["warm", "Warm"], ["mysterious", "Mysterious"], ["bright", "Bright"], ["calm", "Calm"], ["bold", "Bold"], ["playful", "Playful"]];
  const vibes = zh ? [["easy", "轻松"], ["deep", "深入"], ["playful", "好玩"]] : [["easy", "Easy"], ["deep", "Deep"], ["playful", "Playful"]];
  const agains = zh ? [["yes", "愿意"], ["maybe", "也许"], ["no", "不了"]] : [["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]];

  return <div>
    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-amber-100/55">SOCIAL AFTERTASTE</p>
    <h2 className={`${compact ? "text-3xl" : "text-5xl"} mt-4 font-medium leading-[0.94] tracking-[-0.07em]`}>{zh ? `${partnerName || "对方"} 给你留下什么感觉？` : `What stayed with you about ${partnerName || "them"}?`}</h2>
    <div className="mt-7 space-y-6">
      <fieldset><legend className="text-xs text-white/42">{zh ? "第一印象" : "First impression"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{impressions.map(([value, label]) => <button type="button" key={value} onClick={() => setImpression(value)} className={optionClass(impression === value)}>{label}</button>)}</div></fieldset>
      <fieldset><legend className="text-xs text-white/42">{zh ? "聊天的感觉" : "Conversation energy"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{vibes.map(([value, label]) => <button type="button" key={value} onClick={() => setVibe(value)} className={optionClass(vibe === value)}>{label}</button>)}</div></fieldset>
      <fieldset><legend className="text-xs text-white/42">{zh ? "还愿意见面吗？" : "Meet again?"}</legend><div className="mt-3 grid grid-cols-3 gap-2">{agains.map(([value, label]) => <button type="button" key={value} onClick={() => setAgain(value)} className={optionClass(again === value)}>{label}</button>)}</div></fieldset>
    </div>
    <button disabled={!impression || !vibe || !again} onClick={() => onSubmit({ impression, vibe, again })} className="mt-7 min-h-13 w-full rounded-full bg-stone-100 text-sm font-semibold text-black disabled:bg-white/8 disabled:text-white/25">{zh ? "用这份印象，为对方调一杯" : "Turn this impression into their drink"}</button>
  </div>;
}
