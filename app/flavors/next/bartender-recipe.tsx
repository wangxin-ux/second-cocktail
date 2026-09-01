"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { localizeCocktailRecipe } from "@/lib/cocktails/localize-recipe";
import type { CocktailRecipe } from "@/lib/cocktails/types";
import { useI18n } from "@/lib/i18n";
import { clearTonightSession } from "@/lib/second/tonight-privacy";

type BartenderRecipeProps = {
  recipe: CocktailRecipe;
  isGenerating: boolean;
  onMakeAnother: () => void;
  matchHref: string;
};

function formatAmount(
  ingredient: CocktailRecipe["ingredients"][number],
  toTaste: string,
  topUp: string,
  language: "en" | "zh",
) {
  if (ingredient.amountMl !== undefined) return language === "zh" ? `${ingredient.amountMl} 毫升` : `${ingredient.amountMl} ml`;
  if (!ingredient.amountText) return toTaste;

  const escapedName = ingredient.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const conciseAmount = ingredient.amountText
    .replace(new RegExp(`${escapedName}$`, "i"), "")
    .replace(/\s+of$/i, "")
    .trim();

  if (conciseAmount) return conciseAmount;
  return /soda|tonic|ginger beer/i.test(ingredient.name)
    ? topUp
    : toTaste;
}

function methodSteps(method: string) {
  return method
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean);
}

export default function BartenderRecipe({
  recipe,
  isGenerating,
  onMakeAnother,
  matchHref,
}: BartenderRecipeProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const displayedRecipe = localizeCocktailRecipe(recipe, language);
  const steps = methodSteps(displayedRecipe.method);
  const [isKept, setIsKept] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartError, setRestartError] = useState("");

  async function restartTonight() {
    setIsRestarting(true);
    setRestartError("");
    const response = await fetch("/api/end-tonight", { method: "POST", credentials: "same-origin" }).catch(() => null);
    if (!response || (!response.ok && response.status !== 401)) {
      setRestartError(language === "zh" ? "暂时无法重新开始，请稍后再试。" : "Unable to restart right now. Please try again shortly.");
      setIsRestarting(false);
      return;
    }
    clearTonightSession();
    router.replace("/");
    router.refresh();
  }

  return (
    <section
      id="bartender-recipe"
      className="relative border-t border-white/[0.12] bg-[#090806] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16 sm:px-8 sm:pt-20"
    >
      <div className="mx-auto w-full max-w-xl">
        <p className="second-micro text-white/42">
          {t("bartender")}
        </p>
        <h2 className="second-subtitle mt-4 text-stone-100">
          {displayedRecipe.name}
        </h2>

        {(displayedRecipe.allergens?.length || displayedRecipe.caffeineFlag || displayedRecipe.liqueurs?.length) ? (
          <section className="mt-7 rounded-2xl border border-amber-100/[0.16] bg-amber-100/[0.045] p-4 text-sm leading-6 text-amber-50/75">
            {displayedRecipe.liqueurs?.length ? <p><span className="font-semibold text-amber-100">{t("contains")}:</span> {displayedRecipe.liqueurs.join(" · ")}</p> : null}
            {displayedRecipe.allergens?.length ? <p><span className="font-semibold text-amber-100">{t("allergens")}:</span> {displayedRecipe.allergens.join(" / ")}</p> : null}
            {displayedRecipe.caffeineFlag ? <p><span className="font-semibold text-amber-100">{t("caffeine")}</span></p> : null}
          </section>
        ) : null}

        <section className="mt-12">
          <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">
            {t("ingredients")}
          </h3>
          <ul className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.08]">
            {displayedRecipe.ingredients.map((ingredient, index) => (
              <li
                key={`${recipe.id}-${ingredient.name}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-5 py-4"
              >
                <span className="text-[0.94rem] leading-5 text-white/75">
                  {ingredient.name}
                </span>
                <span className="text-right text-[0.94rem] font-semibold tabular-nums text-stone-100">
                  {formatAmount(ingredient, t("toTaste"), t("topUp"), language)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">
            {t("method")}
          </h3>
          <ol className="mt-4 space-y-2.5">
            {steps.map((step, index) => (
              <li
                key={`${recipe.id}-method-${index}`}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-white/70"
              >
                <span className="pt-px text-[0.58rem] font-semibold tabular-nums text-white/22">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <dl className="mt-10 grid grid-cols-2 gap-3 border-y border-white/[0.08] py-5">
          <div>
            <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/28">
              {t("glass")}
            </dt>
            <dd className="mt-2 text-sm font-medium text-white/75">
              {displayedRecipe.glass ?? t("notSpecified")}
            </dd>
          </div>
          <div>
            <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/28">
              {t("garnish")}
            </dt>
            <dd className="mt-2 text-sm font-medium leading-5 text-white/75">
              {displayedRecipe.garnish ?? t("notSpecified")}
            </dd>
          </div>
        </dl>

        <section className="relative mt-16 border-y border-amber-100/[0.2] py-9 pl-6 before:absolute before:bottom-9 before:left-0 before:top-9 before:w-px before:bg-amber-100/60">
          <p className="second-micro text-amber-100/58">{language === "zh" ? "第二幕" : "SECOND ACT"}</p>
          <h3 className="second-subtitle mt-4 max-w-[15ch] text-stone-100">
            {language === "zh" ? "这杯酒之后，想认识今晚的一个人吗？" : "After this drink, would you like to meet one person tonight?"}
          </h3>
          <p className="second-body mt-4">
            {language === "zh" ? "如果你愿意，second 会在今晚也选择加入的人中，为你寻找一个可能值得聊五分钟的人。" : "If you choose to, second will look among people here tonight who also chose to meet someone."}
          </p>
          <Link
            href={matchHref}
            className="second-primary mt-7"
          >
            {language === "zh" ? "认识一个人" : "Meet someone"}
          </Link>
          <button
            type="button"
            onClick={() => setIsKept(true)}
            className="mt-3 min-h-12 w-full text-xs font-semibold text-white/58 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {language === "zh" ? "今晚只喝这杯" : "Keep tonight to myself"}
          </button>
          {isKept ? (
            <p className="mt-2 text-center text-xs leading-5 text-amber-100/65" role="status">
              {language === "zh" ? "这杯酒今晚只属于你；没有开始任何匹配。" : "This drink is yours for tonight. No matching has started."}
            </p>
          ) : null}
        </section>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onMakeAnother}
            className="second-secondary"
          >
            {isGenerating ? t("mixingShort") : t("makeAnother")}
          </button>
          <button type="button" disabled={isRestarting} onClick={() => void restartTonight()} className="second-secondary">
            {isRestarting ? (language === "zh" ? "正在重新开始…" : "Restarting…") : t("startOver")}
          </button>
          {restartError ? <p role="alert" className="text-center text-xs text-rose-200/90">{restartError}</p> : null}
        </div>
      </div>
    </section>
  );
}
