import Link from "next/link";
import type { CocktailRecipe } from "@/lib/cocktails/types";

type BartenderRecipeProps = {
  recipe: CocktailRecipe;
  isGenerating: boolean;
  onMakeAnother: () => void;
  matchHref: string;
};

function formatAmount(
  ingredient: CocktailRecipe["ingredients"][number],
) {
  if (ingredient.amountMl !== undefined) return `${ingredient.amountMl} ml`;
  if (!ingredient.amountText) return "To taste";

  const escapedName = ingredient.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const conciseAmount = ingredient.amountText
    .replace(new RegExp(`${escapedName}$`, "i"), "")
    .replace(/\s+of$/i, "")
    .trim();

  if (conciseAmount) return conciseAmount;
  return /soda|tonic|ginger beer/i.test(ingredient.name)
    ? "Top up"
    : "To taste";
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
  const steps = methodSteps(recipe.method);

  return (
    <section
      id="bartender-recipe"
      className="relative border-t border-white/[0.07] bg-[#0a0a0a] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16 sm:px-8 sm:pt-20"
    >
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-amber-100/45">
          For the bartender
        </p>
        <h2 className="mt-4 text-[2rem] font-medium leading-none tracking-[-0.05em] text-stone-100 sm:text-[2.45rem]">
          {recipe.name}
        </h2>

        <section className="mt-12">
          <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">
            Ingredients
          </h3>
          <ul className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.08]">
            {recipe.ingredients.map((ingredient, index) => (
              <li
                key={`${recipe.id}-${ingredient.name}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-5 py-4"
              >
                <span className="text-[0.94rem] leading-5 text-white/75">
                  {ingredient.name}
                </span>
                <span className="text-right text-[0.94rem] font-semibold tabular-nums text-stone-100">
                  {formatAmount(ingredient)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/30">
            Method
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
              Glass
            </dt>
            <dd className="mt-2 text-sm font-medium text-white/75">
              {recipe.glass ?? "Not specified"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/28">
              Garnish
            </dt>
            <dd className="mt-2 text-sm font-medium leading-5 text-white/75">
              {recipe.garnish ?? "Not specified"}
            </dd>
          </div>
        </dl>

        <section className="mt-12 rounded-[1.5rem] border border-amber-100/[0.12] bg-amber-100/[0.035] p-5">
          <p className="text-[0.57rem] font-semibold uppercase tracking-[0.3em] text-amber-100/45">
            Tonight at second
          </p>
          <h3 className="mt-3 text-xl font-medium tracking-[-0.04em] text-stone-100">
            One drink. One person worth meeting.
          </h3>
          <p className="mt-2 text-xs leading-5 text-white/38">
            Use your profile and drink mood to discover who you should know in
            this room tonight.
          </p>
          <Link
            href={matchHref}
            className="mt-5 flex min-h-13 w-full items-center justify-center rounded-full bg-amber-50 px-5 text-sm font-semibold text-neutral-950 transition-all hover:bg-white active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Find My Tonight Match
          </Link>
        </section>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={onMakeAnother}
            className="min-h-14 w-full rounded-full bg-stone-100 px-6 text-sm font-semibold text-neutral-950 transition-all duration-200 enabled:hover:bg-white enabled:active:scale-[0.99] disabled:cursor-wait disabled:bg-white/15 disabled:text-white/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {isGenerating ? "Mixing…" : "Make Another"}
          </button>
          <Link
            href="/"
            className="flex min-h-14 w-full items-center justify-center rounded-full border border-white/[0.11] px-6 text-sm font-semibold text-white/55 transition-colors hover:border-white/25 hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Start Over
          </Link>
        </div>
      </div>
    </section>
  );
}
