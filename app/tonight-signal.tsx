"use client";

import type { CSSProperties } from "react";
import type { FlavorId } from "./flavors/flavors";
import type { SpiritId } from "./spirits/spirits";
import { useI18n } from "@/lib/i18n";

export type TonightSignalStage =
  | "invitation"
  | "profile"
  | "spirit"
  | "flavor"
  | "mixing"
  | "reveal"
  | "searching"
  | "mutual";

type TonightSignalProps = {
  stage: TonightSignalStage;
  spirit?: SpiritId | null;
  flavor?: FlavorId | null;
  completion?: number;
  cocktailNumber?: number;
  partnerSeed?: string;
  compact?: boolean;
  className?: string;
  label: string;
};

const spiritOrder: SpiritId[] = ["gin", "vodka", "rum", "tequila", "whisky", "brandy"];
const flavorOrder: FlavorId[] = ["sour", "sweet", "bitter", "fruity", "refreshing", "bold"];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function getTonightSignalNumber(cocktailId: string, spirit: SpiritId, flavor: FlavorId) {
  const variant = Number(cocktailId.match(/-(\d+)$/)?.[1]);
  const spiritIndex = spiritOrder.indexOf(spirit);
  const flavorIndex = flavorOrder.indexOf(flavor);

  if (cocktailId.startsWith("108-") && spiritIndex >= 0 && flavorIndex >= 0 && variant >= 1 && variant <= 3) {
    return spiritIndex * 18 + flavorIndex * 3 + variant;
  }

  return (hash(cocktailId) % 108) + 1;
}

export default function TonightSignal({
  stage,
  spirit,
  flavor,
  completion = 0,
  cocktailNumber,
  partnerSeed = "second",
  compact = false,
  className = "",
  label,
}: TonightSignalProps) {
  const { language } = useI18n();
  const completionRatio = Math.max(0, Math.min(1, completion / 5));
  const partnerOffset = (hash(partnerSeed) % 11) - 5;
  const style = {
    "--signal-completion": completionRatio,
    "--partner-offset": `${partnerOffset}px`,
  } as CSSProperties;
  const number = cocktailNumber ? String(cocktailNumber).padStart(3, "0") : "—";

  return (
    <figure
      aria-label={label}
      className={`tonight-signal ${compact ? "tonight-signal--compact" : ""} ${className}`}
      data-flavor={flavor ?? "none"}
      data-spirit={spirit ?? "none"}
      data-stage={stage}
      style={style}
    >
      <svg aria-hidden="true" className="tonight-signal__canvas" viewBox="0 0 240 240">
        <defs>
          <radialGradient id={`signal-field-${stage}`}>
            <stop offset="0" stopColor="currentColor" stopOpacity=".15" />
            <stop offset=".55" stopColor="currentColor" stopOpacity=".035" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="signal-field" cx="120" cy="120" r="112" fill={`url(#signal-field-${stage})`} />
        <g className="signal-primary">
          <circle className="signal-orbit signal-orbit--outer" cx="120" cy="120" r="83" pathLength="100" />
          <ellipse className="signal-orbit signal-orbit--cross" cx="120" cy="120" rx="68" ry="43" />
          <ellipse className="signal-orbit signal-orbit--tilt" cx="120" cy="120" rx="44" ry="72" />
          <path className="signal-line signal-line--left" d="M20 120H82" />
          <path className="signal-line signal-line--right" d="M158 120H220" />
          <path className="signal-line signal-line--vertical" d="M120 20V78M120 162V220" />
          <circle className="signal-core" cx="120" cy="120" r="9" />
          <circle className="signal-core-ring" cx="120" cy="120" r="20" />
        </g>
        {(stage === "searching" || stage === "mutual") ? (
          <g className="signal-secondary">
            <ellipse className="signal-orbit signal-orbit--partner" cx="176" cy="120" rx="32" ry="48" />
            <circle className="signal-partner-core" cx="176" cy="120" r="7" />
          </g>
        ) : null}
        {stage === "mutual" ? <path className="signal-shared-mark" d="M108 120L120 108L132 120L120 132Z" /> : null}
      </svg>
      <figcaption className="tonight-signal__index">
        <span>{stage === "mutual" ? (language === "zh" ? "第二幕" : "SECOND ACT") : (language === "zh" ? "今晚信号" : "TONIGHT SIGNAL")}</span>
        <span>{number} / 108</span>
      </figcaption>
      {stage === "mutual" ? (
        <div aria-hidden="true" className="tonight-signal__mutual-labels">
          <span>{language === "zh" ? "你的信号" : "YOUR SIGNAL"}</span><strong>05</strong><span>{language === "zh" ? "对方信号" : "THEIR SIGNAL"}</span>
        </div>
      ) : null}
    </figure>
  );
}
