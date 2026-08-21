import type { CSSProperties } from "react";
import type { FlavorId } from "../flavors";

const flavorAtmospheres: Record<
  FlavorId,
  { primary: string; secondary: string; line: string }
> = {
  sour: {
    primary: "rgba(214, 220, 154, 0.2)",
    secondary: "rgba(116, 128, 82, 0.12)",
    line: "rgba(235, 238, 191, 0.32)",
  },
  sweet: {
    primary: "rgba(166, 105, 100, 0.2)",
    secondary: "rgba(102, 65, 77, 0.14)",
    line: "rgba(220, 173, 166, 0.28)",
  },
  bitter: {
    primary: "rgba(114, 74, 48, 0.19)",
    secondary: "rgba(72, 48, 35, 0.15)",
    line: "rgba(183, 133, 92, 0.24)",
  },
  fruity: {
    primary: "rgba(151, 82, 101, 0.2)",
    secondary: "rgba(112, 66, 53, 0.14)",
    line: "rgba(212, 142, 148, 0.27)",
  },
  refreshing: {
    primary: "rgba(104, 153, 148, 0.18)",
    secondary: "rgba(74, 103, 111, 0.13)",
    line: "rgba(166, 211, 204, 0.27)",
  },
  bold: {
    primary: "rgba(107, 65, 48, 0.17)",
    secondary: "rgba(43, 35, 33, 0.18)",
    line: "rgba(163, 112, 80, 0.23)",
  },
};

type RevealBackgroundProps = {
  flavor: FlavorId;
};

export default function RevealBackground({ flavor }: RevealBackgroundProps) {
  const atmosphere = flavorAtmospheres[flavor];
  const style = {
    "--reveal-primary": atmosphere.primary,
    "--reveal-secondary": atmosphere.secondary,
    "--reveal-line": atmosphere.line,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={style}
    >
      <div className="reveal-glow absolute left-1/2 top-[13%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--reveal-primary)_0%,transparent_68%)] blur-2xl" />
      <div className="reveal-liquid reveal-liquid-one absolute -right-32 top-[27%] h-[27rem] w-[18rem] rotate-12 rounded-[48%_52%_64%_36%/42%_38%_62%_58%] border border-[var(--reveal-line)] bg-[linear-gradient(145deg,var(--reveal-secondary),transparent_68%)] blur-[1px]" />
      <div className="reveal-liquid reveal-liquid-two absolute -left-32 top-[42%] h-[21rem] w-[17rem] -rotate-12 rounded-[62%_38%_44%_56%/55%_48%_52%_45%] border border-white/[0.035] bg-[radial-gradient(circle_at_70%_35%,var(--reveal-secondary),transparent_70%)]" />
      <div className="absolute inset-x-[12%] top-[58%] h-px bg-gradient-to-r from-transparent via-[var(--reveal-line)] to-transparent opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,0.18)_0%,transparent_35%,rgba(7,7,7,0.72)_100%)]" />
    </div>
  );
}
