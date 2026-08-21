import type { SpiritId } from "@/app/spirits/spirits";
import type { CocktailIngredient, CocktailRecipe } from "./types";

export type RawIbaIngredient = {
  direction?: string;
  quantity?: string;
  unit?: string;
  ingredient?: string;
  note?: string;
};

export type RawIbaRecipe = {
  category?: string;
  name?: string;
  method?: string;
  garnish?: string;
  ingredients?: RawIbaIngredient[];
};

const IBA_SOURCE =
  "https://github.com/rasmusab/iba-cocktails/blob/main/iba-web/iba-cocktails-web.json";

const spiritMatchers: Record<SpiritId, RegExp> = {
  gin: /\bgin\b/i,
  vodka: /\bvodka\b/i,
  rum: /\b(rum|ron|cachaça|cachaca|aguardiente)\b/i,
  tequila: /\b(tequila|mezcal)\b/i,
  whisky: /\b(whisky|whiskey|bourbon|rye|scotch)\b/i,
  brandy: /\b(brandy|cognac|pisco|calvados|armagnac)\b/i,
};

const glassMatchers: Array<[RegExp, string]> = [
  [/double old[- ]fashioned/i, "Double Old Fashioned"],
  [/old[- ]fashioned/i, "Old Fashioned"],
  [/highball/i, "Highball"],
  [/collins glass/i, "Collins"],
  [/flute/i, "Flute"],
  [/champagne glass/i, "Champagne"],
  [/margarita glass/i, "Margarita"],
  [/coupe/i, "Coupe"],
  [/cocktail glass/i, "Cocktail"],
  [/rocks glass/i, "Rocks"],
  [/wine glass/i, "Wine"],
  [/irish coffee glass/i, "Irish Coffee"],
  [/hurricane glass/i, "Hurricane"],
];

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getMlAmount(ingredient: RawIbaIngredient) {
  if (ingredient.unit?.toLowerCase() !== "ml") return undefined;

  const amount = Number(ingredient.quantity);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function normalizeIngredient(
  ingredient: RawIbaIngredient,
): CocktailIngredient | undefined {
  const name = ingredient.ingredient?.trim();
  if (!name) return undefined;

  const amountMl = getMlAmount(ingredient);
  const amountText = ingredient.direction?.trim();

  return {
    name,
    ...(amountMl !== undefined
      ? { amountMl }
      : amountText
        ? { amountText }
        : {}),
  };
}

function inferBaseSpirit(
  ingredients: RawIbaIngredient[],
): SpiritId | undefined {
  const candidates = (Object.entries(spiritMatchers) as [SpiritId, RegExp][])
    .map(([spirit, matcher]) => {
      const amount = ingredients.reduce((total, ingredient) => {
        if (!matcher.test(ingredient.ingredient ?? "")) return total;
        return total + (getMlAmount(ingredient) ?? 1);
      }, 0);

      return { spirit, amount };
    })
    .filter((candidate) => candidate.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return candidates[0]?.spirit;
}

function inferGlass(method: string) {
  return glassMatchers.find(([matcher]) => matcher.test(method))?.[1];
}

export function normalizeIbaRecipes(
  rawRecipes: RawIbaRecipe[],
): CocktailRecipe[] {
  return rawRecipes.flatMap((rawRecipe) => {
    const name = rawRecipe.name?.trim();
    const method = rawRecipe.method?.trim();
    const rawIngredients = rawRecipe.ingredients ?? [];
    const baseSpirit = inferBaseSpirit(rawIngredients);

    if (!name || !method || !baseSpirit) return [];

    const ingredients = rawIngredients
      .map(normalizeIngredient)
      .filter((ingredient): ingredient is CocktailIngredient => Boolean(ingredient));

    if (ingredients.length === 0) return [];

    const garnish = rawRecipe.garnish?.trim();
    const glass = inferGlass(method);

    return [
      {
        id: `iba-${slugify(name)}`,
        name,
        baseSpirit,
        ingredients,
        method,
        ...(glass ? { glass } : {}),
        ...(garnish ? { garnish } : {}),
        source: IBA_SOURCE,
      },
    ];
  });
}
