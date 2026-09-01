"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function PrivacySummary({ className = "" }: { className?: string }) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  const text = language === "zh" ? {
    trigger: "隐私说明", title: "今晚的信息如何使用", close: "知道了",
    items: [
      ["保存在哪里？", "今晚的数据仅保存在这台设备当前打开的页面中。"],
      ["什么会参与匹配？", "年龄用于参与资格；今晚状态、性格类型、星座与鸡尾酒信号可用于解释匹配。"],
      ["对方何时能看到？", "只有你主动开始相遇后，对方才可能看到允许公开的预览；见面区域必须等双方接受。"],
      ["会分享联系方式吗？", "不会。second 不会自动分享电话、社交账号或精确位置。"],
      ["如何删除？", "选择“结束今晚”会清除档案、鸡尾酒、匹配、屏蔽名单和见面区域；语言偏好保留。"],
    ],
  } : {
    trigger: "Privacy summary", title: "How tonight’s information is used", close: "Got it",
    items: [
      ["Where is it stored?", "Tonight data stays on this device for this browser session."],
      ["What informs matching?", "Age is used for eligibility. Energy, optional MBTI and zodiac, and cocktail signals may explain a match."],
      ["When can another person see it?", "Only after you start Connection can an allowed preview be shown. A meeting area appears only after both accept."],
      ["Are contacts shared?", "No. Second does not automatically share phone numbers, social handles, or exact location."],
      ["How do I delete it?", "End tonight clears profile, cocktail, match, blocked people, and meeting area. Language preference remains."],
    ],
  };
  return <>
    <button type="button" className={className || "min-h-11 text-xs text-white/45 underline decoration-white/15 underline-offset-4"} onClick={() => setOpen(true)}>{text.trigger}</button>
    {open ? <div className="fixed inset-0 z-[70] flex items-end bg-black/75 p-5 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div className="second-dialog">
        <p className="second-kicker">{language === "zh" ? "隐私 / 仅限今晚" : "Privacy / Tonight only"}</p><h2 id="privacy-title" className="second-section-title mt-3 text-stone-100">{text.title}</h2>
        <dl className="mt-5 space-y-4">{text.items.map(([question, answer]) => <div key={question}><dt className="text-xs font-semibold text-stone-200">{question}</dt><dd className="mt-1 text-xs leading-5 text-white/48">{answer}</dd></div>)}</dl>
        <button type="button" autoFocus className="second-primary mt-6" onClick={() => setOpen(false)}>{text.close}</button>
      </div>
    </div> : null}
  </>;
}
