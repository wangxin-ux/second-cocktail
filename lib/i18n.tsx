"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";

export type Language = "en" | "zh";

const translations = {
  en: {
    back: "Back", continue: "Continue", optional: "Optional", edit: "Edit",
    recipe: "Recipe", ingredients: "Ingredients", method: "Method", glass: "Glass", garnish: "Garnish",
    notSpecified: "Not specified", toTaste: "To taste", topUp: "Top up",
    homeTitle: "Your night deserves a second story.",
    homeBody: "A drink shaped around you. Then, one person worth meeting.", homeCta: "Begin Tonight",
    profileStep: "Step 01", profileEyebrow: "Your second profile", profileTitle: "Tell us a little. Or nothing at all.",
    profileBody: "Up to six optional signals shape your drink and tonight's match. For this demo, they stay in this browser session.",
    nickname: "Nickname", nicknamePlaceholder: "What should we call you?", age: "Age", height: "Height", zodiac: "Zodiac", energy: "Tonight's energy",
    meetingLocation: "Where to find you", meetingLocationPlaceholder: "e.g. Bar counter, table 12", meetingLocationHelp: "Optional · shown only to a matched person after you both agree.",
    ageError: "Enter an age from 18 to 99", heightError: "Enter a height from 120 to 230 cm", profileSaved: "{count} of 6 added · all editable", profileSkip: "Skip all fields and continue if you prefer",
    spiritStep: "Step 02", baseSpirit: "Base spirit", chooseSpirit: "Choose your spirit.", spiritBody: "Every night starts with a base.",
    flavorStep: "Step 03", craving: "What are you craving?", flavorBody: "Choose the mood of your drink.", base: "Base", generate: "Generate Cocktail", chooseRecipe: "Choose a Recipe", preparing: "Preparing…",
    mixing: "Preparing your fixed recipe", signature: "Second Signature", aiSignature: "Second AI Signature", classic: "Classic", fixedRecipe: "Fixed Menu Recipe", madeFor: "Made for {name}.",
    variantStep: "Step 04", chooseVariant: "Choose your recipe.", variantBody: "Each option is a fixed menu recipe with fixed measures and method.", fixedMenu: "108 fixed-menu recipes", selectRecipe: "Select recipe", contains: "Contains", caffeine: "Caffeine", allergens: "Allergens", noAllergens: "No flagged allergens",
    bartender: "For the bartender", matchEyebrow: "Tonight at second", matchTitle: "One drink. One person worth meeting.", matchBody: "Use your profile and drink mood to discover who you should know in this room tonight.", findMatch: "Find My Tonight Match", makeAnother: "Make Another", startOver: "Start Over", mixingShort: "Mixing…",
    room: "Reading the room", drink: "Your drink", matchLabel: "second / match", matchIntroEyebrow: "Tonight in this bar", matchIntroTitle: "Who should you meet tonight?", matchIntroBody: "We'll combine your optional profile with the mood of {cocktail}. Your answers are used only in this browser demo.",
    matchSignals: "Match signals", fieldsAndDrink: "{count} profile fields + {spirit} × {flavor}", consent: "I agree to use my browser profile for this matching demo. No real person will be contacted.", readRoom: "Read the Room", demoPool: "Demo pool · fictional profiles only", meet: "Tonight, you should meet", whyTonight: "Why tonight", openingLine: "Your opening line", backMatch: "Back to Match Intro", fictional: "Fictional demo result · no contact was made", shared: "You share {reasons}.", different: "Your two drinks bring different energies to the same room.",
    openingBar: "Opening the bar", preparingSecond: "Preparing your second",
    socialTalkEyebrow: "After your drink", socialTalkTitle: "5-minute social talk", socialTalkBody: "Join the people in the room, just for this moment.",
    socialTalk: "Social talk", socialTalkIntro: "A five-minute room for small talk. Be kind, be curious.", peopleHere: "people are here now", onePersonHere: "person is here now", timeLeft: "Time left", messagePlaceholder: "Say something to the room…", send: "Send", roomClosed: "This round has ended.", startNewRound: "Start another round", connecting: "Joining the room…", online: "Live room",
    onlineMatching: "{count} people are matching right now", onlineMatchingOne: "1 person is matching right now",
  },
  zh: {
    back: "返回", continue: "继续", optional: "可选", edit: "修改",
    recipe: "配方", ingredients: "原料", method: "做法", glass: "杯型", garnish: "装饰",
    notSpecified: "未注明", toTaste: "适量", topUp: "加满",
    homeTitle: "你的夜晚，值得拥有第二个故事。",
    homeBody: "一杯为你而调的酒，再遇见一个值得认识的人。", homeCta: "开启今晚",
    profileStep: "第 01 步", profileEyebrow: "你的 second 档案", profileTitle: "告诉我们一点，或什么都不说。",
    profileBody: "最多六项可选信息会影响你的酒与今晚的匹配；演示中仅保留在当前浏览器会话。",
    nickname: "昵称", nicknamePlaceholder: "我们该怎么称呼你？", age: "年龄", height: "身高", zodiac: "星座", energy: "今晚状态",
    meetingLocation: "见面位置", meetingLocationPlaceholder: "例如：吧台、12 号桌", meetingLocationHelp: "可选 · 仅在双方同意匹配后向对方展示。",
    ageError: "请输入 18 至 99 岁", heightError: "请输入 120 至 230 厘米", profileSaved: "已填写 6 项中的 {count} 项 · 均可修改", profileSkip: "如愿意，可跳过全部信息继续",
    spiritStep: "第 02 步", baseSpirit: "基酒", chooseSpirit: "选择你的基酒。", spiritBody: "每个夜晚，都从一款基酒开始。",
    flavorStep: "第 03 步", craving: "你现在想喝什么？", flavorBody: "选择这杯酒的情绪。", base: "基酒", generate: "生成鸡尾酒", chooseRecipe: "选择配方", preparing: "正在准备…",
    mixing: "正在准备固定配方", signature: "second 专属酒", aiSignature: "second AI 专属酒", classic: "经典配方", fixedRecipe: "固定菜单配方", madeFor: "为 {name} 而调。",
    variantStep: "第 04 步", chooseVariant: "选择你的配方。", variantBody: "每一款都是固定毫升数与固定制作法的菜单配方。", fixedMenu: "108 杯固定菜单", selectRecipe: "选择此配方", contains: "含有", caffeine: "咖啡因", allergens: "过敏原", noAllergens: "未标记过敏原",
    bartender: "给调酒师", matchEyebrow: "今晚，在 second", matchTitle: "一杯酒，遇见一个值得认识的人。", matchBody: "用你的档案和酒的情绪，发现今晚值得认识的那个人。", findMatch: "寻找今晚的 Match", makeAnother: "再调一杯", startOver: "重新开始", mixingShort: "调制中…",
    room: "正在读懂现场", drink: "你的酒", matchLabel: "second / 匹配", matchIntroEyebrow: "今晚，在这间酒吧", matchIntroTitle: "今晚，你该认识谁？", matchIntroBody: "我们会结合你的可选档案与「{cocktail}」的情绪。信息只用于此浏览器演示。",
    matchSignals: "匹配信号", fieldsAndDrink: "{count} 项档案信息 + {spirit} × {flavor}", consent: "我同意使用浏览器中的个人档案进行这次匹配演示；不会联系任何真实人物。", readRoom: "开始匹配", demoPool: "演示池 · 仅虚构档案", meet: "今晚，你应该认识", whyTonight: "为什么是今晚", openingLine: "你的破冰开场", backMatch: "返回匹配介绍", fictional: "虚构演示结果 · 未联系任何真实人物", shared: "你们拥有 {reasons}。", different: "两杯酒为同一个空间带来了不同能量。",
    openingBar: "正在打开酒吧", preparingSecond: "正在准备你的 second",
    socialTalkEyebrow: "点酒之后", socialTalkTitle: "限时 5 分钟 Social Talk", socialTalkBody: "加入当下在场的人，聊聊这一刻。",
    socialTalk: "Social Talk", socialTalkIntro: "一个只持续五分钟的轻松聊天室。友善一点，好奇一点。", peopleHere: "人正在参与", onePersonHere: "1 人正在参与", timeLeft: "剩余时间", messagePlaceholder: "和现场说点什么…", send: "发送", roomClosed: "本轮交流已结束。", startNewRound: "开始新一轮", connecting: "正在加入现场…", online: "实时房间",
    onlineMatching: "当前有 {count} 人正在匹配", onlineMatchingOne: "当前有 1 人正在匹配",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];
type I18nContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(
    (callback) => {
      window.addEventListener("second-language-change", callback);
      return () => window.removeEventListener("second-language-change", callback);
    },
    () => (window.localStorage.getItem("second:language") === "zh" ? "zh" : "en"),
    () => "en",
  );
  const setLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem("second:language", nextLanguage);
    window.dispatchEvent(new Event("second-language-change"));
  };
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);
  const t = (key: TranslationKey, values: Record<string, string | number> = {}) =>
    translations[language][key].replace(/\{(\w+)\}/g, (_: string, name: string) => String(values[name] ?? ""));
  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}

const localizedSpirits: Record<SpiritId, { zh: string; profile: string }> = {
  gin: { zh: "金酒", profile: "草本 · 清爽" }, vodka: { zh: "伏特加", profile: "纯净 · 顺滑" }, rum: { zh: "朗姆酒", profile: "甜润 · 热带" }, tequila: { zh: "龙舌兰", profile: "泥土感 · 明亮" }, whisky: { zh: "威士忌", profile: "温暖 · 浓烈" }, brandy: { zh: "白兰地", profile: "醇厚 · 丝滑" },
};
const localizedFlavors: Record<FlavorId, { zh: string; description: string }> = {
  sour: { zh: "酸", description: "明亮 · 柑橘" }, sweet: { zh: "甜", description: "顺滑 · 丰润" }, bitter: { zh: "苦", description: "复杂 · 成熟" }, fruity: { zh: "果香", description: "多汁 · 芳香" }, refreshing: { zh: "清爽", description: "轻盈 · 清新" }, bold: { zh: "浓烈", description: "强劲 · 深邃" },
};
const localizedMatchCandidates = {
  mika: { oneLine: "收集城市故事，总能听见房间里最好听的那首歌。", opener: "问问对方：如果可以消失一个月，会去哪座城市？" },
  noah: { oneLine: "白天搭建新东西，晚上寻找能把人带出日常的音乐。", opener: "问问对方：最近有没有哪个想法让你停不下来？" },
  sora: { oneLine: "用相机和笔记本捕捉被人忽略的细节。", opener: "问问对方：今天有什么小瞬间值得被记下来？" },
  alex: { oneLine: "有点过度好奇，总愿意为好问题多停留一会儿。", opener: "问问对方：你最近在反复思考什么？" },
  lin: { oneLine: "把陌生人和新点子串成一条线，热爱临时起意的冒险。", opener: "问问对方：如果今晚可以随时出发，会去哪儿？" },
  jules: { oneLine: "擅长从日常里找到仪式感，也乐于分享一个好发现。", opener: "问问对方：最近有什么小发现让你很开心？" },
} as const;
const localizedMatchReasons: Record<string, string> = {
  "a complementary social rhythm": "互补的社交节奏",
  "a similar way of reading the room": "相似的观察方式",
  "the same zodiac energy": "相同的星座能量",
  "the same intention for tonight": "相同的今晚期待",
  "a different drinking instinct": "不同的饮酒直觉",
  "a shared flavor wavelength": "共鸣的风味频率",
};
export function localizeSpirit(id: SpiritId, english: string, language: Language) { return language === "zh" ? localizedSpirits[id].zh : english; }
export function localizeSpiritProfile(id: SpiritId, english: string, language: Language) { return language === "zh" ? localizedSpirits[id].profile : english; }
export function localizeFlavor(id: FlavorId, english: string, language: Language) { return language === "zh" ? localizedFlavors[id].zh : english; }
export function localizeFlavorDescription(id: FlavorId, english: string, language: Language) { return language === "zh" ? localizedFlavors[id].description : english; }
export function localizeEnergy(id: string, english: string, language: Language) {
  if (language === "en") return english;
  return ({ open: "愿意尝试新事物", curious: "好奇且善于观察", slow: "慢一点就好", celebrating: "正在庆祝" }[id] ?? english);
}
export function localizeMatchCandidate(id: string, english: string, language: Language, field: "oneLine" | "opener") {
  if (language === "en") return english;
  return localizedMatchCandidates[id as keyof typeof localizedMatchCandidates]?.[field] ?? english;
}
export function localizeMatchReason(reason: string, language: Language) {
  return language === "zh" ? localizedMatchReasons[reason] ?? reason : reason;
}
