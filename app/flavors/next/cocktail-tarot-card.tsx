import type { CSSProperties } from "react";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import type { SecondProfile } from "@/lib/second/profile";
import type { Language } from "@/lib/i18n";
import TonightSignal, { getTonightSignalNumber } from "../../tonight-signal";

type CocktailTarotCardProps = {
  cocktailId: string;
  cocktailName: string;
  spirit: SpiritId;
  flavor: FlavorId;
  profile: SecondProfile;
  language: Language;
};

const spiritOrder: SpiritId[] = [
  "gin",
  "vodka",
  "rum",
  "tequila",
  "whisky",
  "brandy",
];

const spiritSymbols: Record<SpiritId, string> = {
  gin: "✦",
  vodka: "◈",
  rum: "☾",
  tequila: "☀",
  whisky: "♜",
  brandy: "✺",
};

const flavorSymbols: Record<FlavorId, string> = {
  sour: "◇",
  sweet: "●",
  bitter: "✢",
  fruity: "❋",
  refreshing: "≋",
  bold: "✹",
};

const zodiacSymbols: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const flavorCopy: Record<FlavorId, { en: string; zh: string; hue: number }> = {
  sour: { en: "bright tension", zh: "明亮张力", hue: 68 },
  sweet: { en: "velvet balance", zh: "丝绒平衡", hue: 348 },
  bitter: { en: "layered depth", zh: "层叠深度", hue: 28 },
  fruity: { en: "vivid bloom", zh: "鲜活盛放", hue: 326 },
  refreshing: { en: "clear current", zh: "清澈流动", hue: 169 },
  bold: { en: "lasting fire", zh: "余韵之火", hue: 16 },
};

export default function CocktailTarotCard({
  cocktailId,
  cocktailName,
  spirit,
  flavor,
  profile,
  language,
}: CocktailTarotCardProps) {
  const cardNumber = getTonightSignalNumber(cocktailId, spirit, flavor);
  const designIndex = cardNumber - 1;
  const layout = designIndex % 6;
  const pattern = Math.floor(designIndex / 6) % 6;
  const frame = Math.floor(designIndex / 36);
  const spiritIndex = spiritOrder.indexOf(spirit);
  const zodiacOffset = profile.zodiac
    ? Object.keys(zodiacSymbols).indexOf(profile.zodiac) % 5
    : 0;
  const hue =
    (flavorCopy[flavor].hue + spiritIndex * 7 + (designIndex % 3) * 4 + zodiacOffset * 2) %
    360;
  const guest =
    profile.nickname || (language === "zh" ? "今夜来宾" : "TONIGHT'S GUEST");
  const style = {
    "--card-ink": `hsl(${hue} 68% 72%)`,
    "--card-accent": `hsl(${(hue + 34) % 360} 76% 78%)`,
    "--card-glow": `hsla(${hue} 78% 62% / 0.3)`,
    "--card-surface": `hsl(${hue} 18% 7%)`,
    "--card-rotation": `${((designIndex % 7) - 3) * 0.35}deg`,
  } as CSSProperties;

  return (
    <article
      aria-label={
        language === "zh"
          ? `${cocktailName} 专属卡片，第 ${cardNumber} 张，共 108 张`
          : `${cocktailName} card, ${cardNumber} of 108`
      }
      className="tarot-card"
      data-frame={frame}
      data-layout={layout}
      data-pattern={pattern}
      style={style}
    >
      <div className="tarot-card__field" aria-hidden="true" />
      <div className="tarot-card__grain" aria-hidden="true" />
      <div
        className="tarot-card__border tarot-card__border--outer"
        aria-hidden="true"
      />
      <div
        className="tarot-card__border tarot-card__border--inner"
        aria-hidden="true"
      />

      <div className="tarot-card__topline">
        <span>SECOND / SIGNATURE</span>
        <span>{profile.zodiac ? `${zodiacSymbols[profile.zodiac]} ` : ""}{String(cardNumber).padStart(3, "0")} / 108</span>
      </div>

      <TonightSignal
        stage="reveal"
        spirit={spirit}
        flavor={flavor}
        cocktailNumber={cardNumber}
        compact
        label={language === "zh" ? `完整的今晚信号，第 ${cardNumber} 张，共 108 张` : `Complete tonight signal, ${cardNumber} of 108`}
        className="tarot-card__signal"
      />

      <div className="tarot-card__identity">
        <p>{language === "zh" ? "属于今晚的你" : "SHAPED FOR TONIGHT"}</p>
        <h2>{cocktailName}</h2>
        <span>
          {guest} · {flavorCopy[flavor][language]}
        </span>
      </div>

      <div className="tarot-card__footer">
        <span>
          {spirit.toUpperCase()} · {flavor.toUpperCase()}
        </span>
        <span>
          {spiritSymbols[spirit]} {flavorSymbols[flavor]}
        </span>
      </div>
    </article>
  );
}
