"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AgentProposal, AgentReply } from "@/lib/agent/intent";
import { readTonightCocktailSession } from "@/lib/cocktails/tonight-session";
import { useI18n } from "@/lib/i18n";
import { readSecondProfile, writeSecondProfile } from "@/lib/second/profile";
import { isAgeConfirmed } from "@/lib/second/tonight-privacy";
import { useSecondProfile } from "@/lib/second/use-second-profile";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; proposal?: AgentProposal };

function id() {
  return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function AgentAssistant() {
  const { language } = useI18n();
  const { profile } = useSecondProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const zh = language === "zh";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const greeting = zh ? "今晚想喝什么，或想认识怎样的人？" : "What would you like to drink, or who would you like to meet tonight?";
  const quickPrompts = zh ? ["帮我选一杯清爽的酒", "设置匹配偏好", "打开个人信息"] : ["Choose me a refreshing drink", "Set matching preferences", "Open my profile"];

  async function send(override?: string) {
    const content = (override ?? input).trim();
    if (!content || busy) return;
    const userMessage: ChatMessage = { id: id(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    const cocktail = readTonightCocktailSession();
    try {
      const response = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: content,
          language,
          history: messages.slice(-6).map(({ role, content: previous }) => ({ role, content: previous })),
          context: {
            pathname,
            ageConfirmed: isAgeConfirmed(),
            profile: {
              hasNickname: Boolean(profile.nickname),
              age: profile.age,
              heightCm: profile.heightCm,
              gender: profile.gender,
              preferredGender: profile.preferredGender,
              minPartnerHeightCm: profile.minPartnerHeightCm,
              hasMeetingLocation: Boolean(profile.meetingLocation),
              mbti: profile.mbti,
              energy: profile.energy,
            },
            drink: cocktail ? { spirit: cocktail.spirit, flavor: cocktail.flavor, selected: true } : { selected: false },
          },
        }),
      });
      if (!response.ok) throw new Error("unavailable");
      const result = await response.json() as AgentReply;
      setMessages((current) => [...current, { id: id(), role: "assistant", content: result.reply, proposal: result.proposal }]);
    } catch {
      setMessages((current) => [...current, { id: id(), role: "assistant", content: zh ? "今晚助手暂时没有连上。你仍然可以继续点击页面操作。" : "The assistant is temporarily unavailable. You can keep using the page controls." }]);
    } finally {
      setBusy(false);
    }
  }

  function addStatus(content: string) {
    setMessages((current) => [...current, { id: id(), role: "assistant", content }]);
  }

  function apply(proposal: AgentProposal) {
    const current = readSecondProfile();
    const nextProfile = proposal.profilePatch ? { ...current, ...proposal.profilePatch } : current;
    if (proposal.profilePatch) writeSecondProfile(nextProfile);

    const cocktail = readTonightCocktailSession();
    let target = proposal.destination;
    if (proposal.drink) target = target ?? "match";
    if (target && target !== "home" && !isAgeConfirmed()) {
      setOpen(false);
      router.push("/");
      addStatus(zh ? "请先在首页确认已满 18 岁，再继续今晚。" : "Confirm that you are 18 or over on the home page before continuing.");
      return;
    }
    if (proposal.drink) {
      setOpen(false);
      router.push(`/flavors/next?${new URLSearchParams(proposal.drink).toString()}`);
      return;
    }
    if (target === "match") {
      const complete = nextProfile.nickname && nextProfile.age && nextProfile.meetingLocation && nextProfile.energy;
      if (!complete) {
        setOpen(false);
        router.push("/profile");
        addStatus(zh ? "先补全昵称、年龄、见面地点和今晚状态，我已经保留了你的匹配偏好。" : "Complete your nickname, age, meeting location, and tonight’s energy. I kept your matching preferences.");
        return;
      }
      if (!cocktail) {
        setOpen(false);
        router.push("/spirits");
        addStatus(zh ? "匹配前先选定今晚的酒。" : "Choose tonight’s drink before matching.");
        return;
      }
      setOpen(false);
      router.push(`/match?${new URLSearchParams({ spirit: cocktail.spirit, flavor: cocktail.flavor }).toString()}`);
      return;
    }
    const paths = { home: "/", profile: "/profile", spirits: "/spirits" } as const;
    if (target && target in paths) {
      setOpen(false);
      router.push(paths[target as keyof typeof paths]);
      return;
    }
    addStatus(zh ? "已更新。页面上的点击操作仍然可以继续使用。" : "Updated. You can keep using the page controls as usual.");
  }

  return <>
    <button type="button" className="agent-companion" aria-label={zh ? "打开今晚助手" : "Open tonight assistant"} title={zh ? "今晚助手" : "Tonight assistant"} aria-expanded={open} onClick={() => setOpen(true)}>
      <span className="agent-companion__orbit" aria-hidden="true" />
      <span className="agent-companion__eyes" aria-hidden="true"><i /><i /></span>
    </button>
    {open ? <section className="agent-panel" role="dialog" aria-modal="false" aria-label={zh ? "今晚助手" : "Tonight assistant"}>
      <header className="agent-panel__header">
        <div><p className="second-micro text-amber-100/55">SECOND / AGENT</p><h2 className="mt-1 text-sm font-medium text-stone-100">{zh ? "今晚助手" : "Tonight assistant"}</h2></div>
        <button type="button" className="second-focus h-11 w-11 text-xl text-white/55" aria-label={zh ? "关闭" : "Close"} onClick={() => setOpen(false)}>×</button>
      </header>
      <div ref={logRef} className="agent-panel__log" aria-live="polite">
        <div className="agent-message agent-message--assistant"><p>{greeting}</p></div>
        {messages.map((message) => <div key={message.id} className={`agent-message agent-message--${message.role}`}>
          <p>{message.content}</p>
          {message.proposal ? <button type="button" className="agent-apply" onClick={() => apply(message.proposal!)}>{zh ? "确认执行" : "Confirm"}</button> : null}
        </div>)}
        {busy ? <div className="agent-message agent-message--assistant" role="status"><span className="agent-thinking" aria-label={zh ? "正在思考" : "Thinking"}><i /><i /><i /></span></div> : null}
      </div>
      {!messages.length ? <div className="agent-quick-actions">{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void send(prompt)}>{prompt}</button>)}</div> : null}
      <form className="agent-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 500))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder={zh ? "说出你今晚的想法" : "Say what you want tonight"} aria-label={zh ? "给今晚助手发送消息" : "Message tonight assistant"} />
        <button type="submit" disabled={!input.trim() || busy} aria-label={zh ? "发送" : "Send"}>↑</button>
      </form>
    </section> : null}
  </>;
}
