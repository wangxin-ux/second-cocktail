"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FlavorId } from "../flavors";
import type { SpiritId } from "../../spirits/spirits";
import LanguageToggle from "../../language-toggle";
import { getMenuVariants } from "@/lib/cocktails/fixed-menu";
import { localizeFlavor, localizeSpirit, useI18n } from "@/lib/i18n";

type VariantSelectionProps = {
  spirit: { id: SpiritId; name: string };
  flavor: { id: FlavorId; name: string };
};

export default function VariantSelection({ spirit, flavor }: VariantSelectionProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const variants = getMenuVariants(spirit.id, flavor.id);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#080808] px-5 pb-8 pt-5 sm:px-6">
      <div className="relative mx-auto w-full max-w-md">
        <header className="flex min-h-11 items-center justify-between">
          <Link href={`/flavors?spirit=${spirit.id}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80">
            <span aria-hidden="true">←</span>{t("back")}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-amber-100/55">{t("variantStep")}</span>
          </div>
        </header>

        <section className="pb-7 pt-8">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-100/45">{t("fixedMenu")}</p>
          <h1 className="mt-4 text-[2.35rem] font-medium leading-[0.94] tracking-[-0.06em] text-stone-100">{t("chooseVariant")}</h1>
          <p className="mt-4 text-sm leading-6 text-white/45">{t("variantBody")}</p>
          <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/35">
            {localizeSpirit(spirit.id, spirit.name, language)} <span className="mx-1 text-white/20">×</span> {localizeFlavor(flavor.id, flavor.name, language)}
          </p>
        </section>

        <div className="space-y-3">
          {variants.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => router.push(`/flavors/next?spirit=${spirit.id}&flavor=${flavor.id}&variant=${recipe.variantIndex}`)}
              className="w-full rounded-[1.4rem] border border-white/[0.09] bg-white/[0.025] p-5 text-left transition-colors hover:border-amber-100/35 hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-amber-100/48">{t("selectRecipe")} {String(recipe.variantIndex).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-xl font-medium tracking-[-0.035em] text-stone-100">{recipe.name}</h2>
                </div>
                <span className="mt-1 text-base text-amber-100/55" aria-hidden="true">→</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/48">{recipe.ingredients.map((ingredient) => ingredient.name).join(" · ")}</p>
              {(recipe.allergens.length > 0 || recipe.caffeineFlag) ? (
                <p className="mt-4 text-[0.6rem] font-semibold tracking-[0.08em] text-amber-100/60">
                  {recipe.allergens.length > 0 ? `${t("allergens")}: ${recipe.allergens.join(" / ")}` : ""}{recipe.allergens.length > 0 && recipe.caffeineFlag ? " · " : ""}{recipe.caffeineFlag ? t("caffeine") : ""}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
