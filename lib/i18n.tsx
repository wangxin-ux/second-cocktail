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
    homeBody: "First, a drink shaped around you. Then, if you choose, a mutual connection.", homeCta: "Begin Tonight",
    profileStep: "Step 01", profileEyebrow: "Your second profile", profileTitle: "Tell us a little. Or nothing at all.",
    profileBody: "Five optional signals help Second understand tonight. They stay in this browser session.",
    shapesDrink: "Shapes your drink", shapesDrinkFields: "Energy leads. MBTI refines gently. Zodiac shapes the reveal.", connectionLater: "For connection later", connectionLaterFields: "Nickname and age are used only if you choose to meet someone. Meeting area comes after mutual acceptance.",
    nickname: "Nickname", nicknamePlaceholder: "What should we call you?", age: "Age", zodiac: "Zodiac", energy: "Tonight's energy",
    ageError: "Enter an age from 18 to 99", profileSaved: "{count} of 5 added · all editable", profileSkip: "Skip all fields and continue if you prefer",
    nicknameUse: "Addresses you tonight · shown only if you start Connection", ageUse: "Connection eligibility · shown only as age", zodiacUse: "Optional reveal and match explanation · not shown directly", mbtiUse: "Optional cocktail refinement and match explanation · not shown directly", energyUse: "Shapes your cocktail and match explanation · may appear in your Connection preview",
    spiritStep: "Step 02", baseSpirit: "Base spirit", chooseSpirit: "Choose your spirit.", spiritBody: "Every night starts with a base.",
    flavorStep: "Step 03", craving: "What are you craving?", flavorBody: "Choose the mood of your drink.", base: "Base", generate: "Generate Cocktail", chooseRecipe: "Choose a Recipe", preparing: "Preparing…",
    mixing: "Preparing your fixed recipe", signature: "Second Signature", aiSignature: "Second AI Signature", classic: "Classic", fixedRecipe: "Fixed Menu Recipe", madeFor: "Made for {name}.",
    variantStep: "Step 04", chooseVariant: "Choose your recipe.", variantBody: "Each option is a fixed menu recipe with fixed measures and method.", fixedMenu: "108 fixed-menu recipes", selectRecipe: "Select recipe", contains: "Contains", caffeine: "Caffeine", allergens: "Allergens", noAllergens: "No flagged allergens",
    bartender: "For the bartender", whyDrink: "Why this drink", matchEyebrow: "Your night, your choice", matchTitle: "Your drink can stop here. Or become an introduction.", matchBody: "Second can use tonight’s signals to find one person here with something worth starting a conversation around.", connectionOptional: "Optional", connectionMutual: "Both people accept", connectionPrivate: "No automatic contact sharing", connectionLeave: "Leave anytime", findMatch: "Meet someone through this drink", keepDrink: "Keep it for myself", keptDrink: "This drink is yours for tonight. No matching has started.", makeAnother: "Make Another", startOver: "Start Over", mixingShort: "Mixing…",
    room: "Reading the room", drink: "Your drink", matchLabel: "second / match", matchIntroEyebrow: "Tonight in this bar", matchIntroTitle: "Who should you meet tonight?", matchIntroBody: "We'll combine your optional profile with the mood of {cocktail}. Your answers are used only in this browser demo.",
    matchSignals: "Match signals", fieldsAndDrink: "{count} profile fields + {spirit} × {flavor}", consent: "I agree to use my browser profile for this matching demo. No real person will be contacted.", readRoom: "Read the Room", demoPool: "Demo pool · fictional profiles only", meet: "Tonight, you should meet", whyTonight: "Why tonight", openingLine: "Your opening line", backMatch: "Back to Match Intro", fictional: "Fictional demo result · no contact was made", shared: "You share {reasons}.", different: "Your two drinks bring different energies to the same room.",
    openingBar: "Opening the bar", preparingSecond: "Preparing your second",
  },
  zh: {
    back: "返回", continue: "继续", optional: "可选", edit: "修改",
    recipe: "配方", ingredients: "原料", method: "做法", glass: "杯型", garnish: "装饰",
    notSpecified: "未注明", toTaste: "适量", topUp: "加满",
    homeTitle: "你的夜晚，值得拥有第二个故事。",
    homeBody: "先有一杯为你而调的酒。然后，如果你愿意，再开启一次双方同意的相遇。", homeCta: "开启今晚",
    profileStep: "第 01 步", profileEyebrow: "你的 second 档案", profileTitle: "告诉我们一点，或什么都不说。",
    profileBody: "五项可选信息帮助 Second 理解今晚的你；它们仅保留在当前浏览器会话。",
    shapesDrink: "塑造你的酒", shapesDrinkFields: "今晚状态最重要，MBTI 只做轻调，星座塑造 Reveal 氛围。", connectionLater: "留给稍后的 Connection", connectionLaterFields: "昵称和年龄仅在你主动选择认识某人时使用；见面区域在双方接受后再询问。",
    nickname: "昵称", nicknamePlaceholder: "我们该怎么称呼你？", age: "年龄", zodiac: "星座", energy: "今晚状态",
    ageError: "请输入 18 至 99 岁", profileSaved: "已填写 5 项中的 {count} 项 · 均可修改", profileSkip: "如愿意，可跳过全部信息继续",
    nicknameUse: "用于今晚称呼你 · 仅在你开始 Connection 后展示", ageUse: "用于 Connection 参与资格 · 只展示年龄", zodiacUse: "可选，用于 Reveal 与匹配解释 · 不直接展示", mbtiUse: "可选，用于轻调 Cocktail 与匹配解释 · 不直接展示", energyUse: "塑造 Cocktail 与匹配解释 · 可能出现在 Connection 预览中",
    spiritStep: "第 02 步", baseSpirit: "基酒", chooseSpirit: "选择你的基酒。", spiritBody: "每个夜晚，都从一款基酒开始。",
    flavorStep: "第 03 步", craving: "你现在想喝什么？", flavorBody: "选择这杯酒的情绪。", base: "基酒", generate: "生成鸡尾酒", chooseRecipe: "选择配方", preparing: "正在准备…",
    mixing: "正在准备固定配方", signature: "second 专属酒", aiSignature: "second AI 专属酒", classic: "经典配方", fixedRecipe: "固定菜单配方", madeFor: "为 {name} 而调。",
    variantStep: "第 04 步", chooseVariant: "选择你的配方。", variantBody: "每一款都是固定毫升数与固定制作法的菜单配方。", fixedMenu: "108 杯固定菜单", selectRecipe: "选择此配方", contains: "含有", caffeine: "咖啡因", allergens: "过敏原", noAllergens: "未标记过敏原",
    bartender: "给调酒师", whyDrink: "为什么是这杯", matchEyebrow: "今晚，由你选择", matchTitle: "这杯酒可以停在这里，也可以成为一次介绍。", matchBody: "Second 会用今晚的信号，找到一个真正有话题可以开始的人。", connectionOptional: "完全可选", connectionMutual: "双方都接受才继续", connectionPrivate: "不会自动分享联系方式", connectionLeave: "随时可以离开", findMatch: "通过这杯酒认识一个人", keepDrink: "把它留给自己", keptDrink: "这杯酒今晚只属于你；没有开始任何匹配。", makeAnother: "再调一杯", startOver: "重新开始", mixingShort: "调制中…",
    room: "正在读懂现场", drink: "你的酒", matchLabel: "second / 匹配", matchIntroEyebrow: "今晚，在这间酒吧", matchIntroTitle: "今晚，你该认识谁？", matchIntroBody: "我们会结合你的可选档案与「{cocktail}」的情绪。信息只用于此浏览器演示。",
    matchSignals: "匹配信号", fieldsAndDrink: "{count} 项档案信息 + {spirit} × {flavor}", consent: "我同意使用浏览器中的个人档案进行这次匹配演示；不会联系任何真实人物。", readRoom: "开始匹配", demoPool: "演示池 · 仅虚构档案", meet: "今晚，你应该认识", whyTonight: "为什么是今晚", openingLine: "你的破冰开场", backMatch: "返回匹配介绍", fictional: "虚构演示结果 · 未联系任何真实人物", shared: "你们拥有 {reasons}。", different: "两杯酒为同一个空间带来了不同能量。",
    openingBar: "正在打开酒吧", preparingSecond: "正在准备你的 second",
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
