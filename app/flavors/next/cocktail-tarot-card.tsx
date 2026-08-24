import type { CSSProperties } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { SecondProfile } from "@/lib/second/profile";
import type { Language } from "@/lib/i18n";

type CocktailTarotCardProps = {
  cocktailName: string;
  spirit: SpiritId;
  flavor: FlavorId;
  profile: SecondProfile;
  language: Language;
};

type CardTheme = {
  ink: string;
  glow: string;
  accent: string;
  constellation: string;
  title: { en: string; zh: string };
  quality: { en: string; zh: string };
};

const themes: Record<FlavorId, CardTheme> = {
  sour: { ink: "#d6d982", glow: "rgba(214,217,130,0.32)", accent: "#f4e7aa", constellation: "✦", title: { en: "THE CITRUS ORACLE", zh: "柑橘神谕" }, quality: { en: "lucid instinct", zh: "清醒直觉" } },
  sweet: { ink: "#df9c9b", glow: "rgba(223,156,155,0.33)", accent: "#ffd8cf", constellation: "❋", title: { en: "THE VELVET HOUR", zh: "丝绒时刻" }, quality: { en: "soft magnetism", zh: "柔软吸引力" } },
  bitter: { ink: "#ca9866", glow: "rgba(202,152,102,0.31)", accent: "#efc38b", constellation: "✢", title: { en: "THE DARK GARDEN", zh: "暗夜花园" }, quality: { en: "quiet complexity", zh: "沉静复杂度" } },
  fruity: { ink: "#d484a2", glow: "rgba(212,132,162,0.32)", accent: "#ffc0d2", constellation: "✽", title: { en: "THE WILD BLOOM", zh: "野性盛放" }, quality: { en: "playful gravity", zh: "灵动引力" } },
  refreshing: { ink: "#82c9bd", glow: "rgba(130,201,189,0.31)", accent: "#c2f0e7", constellation: "✧", title: { en: "THE CLEAR SIGNAL", zh: "清澈讯号" }, quality: { en: "open current", zh: "开放流动感" } },
  bold: { ink: "#c88165", glow: "rgba(200,129,101,0.34)", accent: "#f1b897", constellation: "✹", title: { en: "THE LAST FLAME", zh: "最后一簇火" }, quality: { en: "unmistakable presence", zh: "鲜明存在感" } },
};

const zodiacSymbols: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const spiritSymbols: Record<SpiritId, string> = {
  gin: "✦", vodka: "◈", rum: "☾", tequila: "☀", whisky: "♜", brandy: "✺",
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function cardNumber(value: number) {
  return String((value % 78) + 1).padStart(2, "0");
}

export default function CocktailTarotCard({
  cocktailName,
  spirit,
  flavor,
  profile,
  language,
}: CocktailTarotCardProps) {
  const theme = themes[flavor];
  const identity = [cocktailName, spirit, flavor, profile.zodiac, profile.mbti, profile.energy, profile.age].join("|");
  const number = hash(identity);
  const symbol = zodiacSymbols[profile.zodiac ?? ""] ?? spiritSymbols[spirit];
  const secondarySymbol = spiritSymbols[spirit];
  const personalMark = profile.mbti ?? (language === "zh" ? "今夜" : "TONIGHT");
  const name = profile.nickname || (language === "zh" ? "未知旅人" : "UNKNOWN GUEST");
  const style = {
    "--card-ink": theme.ink,
    "--card-glow": theme.glow,
    "--card-accent": theme.accent,
  } as CSSProperties;

  return (
    <article aria-label={language === "zh" ? "为你抽出的鸡尾酒塔罗牌" : "Your personal cocktail tarot card"} className="tarot-card" style={style}>
      <div className="tarot-card__grain" />
      <div className="tarot-card__border tarot-card__border--outer" />
      <div className="tarot-card__border tarot-card__border--inner" />
      <div className="tarot-card__corner tarot-card__corner--one">{cardNumber(number)}</div>
      <div className="tarot-card__corner tarot-card__corner--two">SECOND</div>

      <div className="tarot-card__topline">
        <span>{theme.constellation} {personalMark}</span>
        <span>{theme.constellation} {cardNumber(number)}</span>
      </div>

      <div className="tarot-card__orb" aria-hidden="true">
        <span className="tarot-card__orbit tarot-card__orbit--one" />
        <span className="tarot-card__orbit tarot-card__orbit--two" />
        <span className="tarot-card__symbol">{symbol}</span>
        <span className="tarot-card__spirit">{secondarySymbol}</span>
      </div>

      <div className="tarot-card__identity">
        <p>{language === "zh" ? "今夜的饮酒人格" : "TONIGHT'S DRINKING SIGN"}</p>
        <h2>{theme.title[language]}</h2>
        <span>{name} · {theme.quality[language]}</span>
      </div>

      <div className="tarot-card__footer">
        <span>{language === "zh" ? "第二张牌 · 仅存于此刻" : "SECOND CARD · HELD IN THIS MOMENT"}</span>
        <span>{theme.constellation}</span>
      </div>
    </article>
  );
}
