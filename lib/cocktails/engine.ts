import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { classicRecipes } from "./recipes";
import type { CocktailRecipe } from "./types";

export type CocktailEngineInput = {
  spirit: SpiritId;
  flavor: FlavorId;
};

const flavorKeywords: Record<FlavorId, string[]> = {
  sour: ["sour", "lemon", "lime", "citrus", "grapefruit"],
  sweet: [
    "syrup",
    "liqueur",
    "sweet vermouth",
    "cream",
    "honey",
    "sugar",
    "cacao",
  ],
  bitter: ["bitters", "bitter", "campari", "amaro", "fernet", "aperol"],
  fruity: [
    "fruit",
    "juice",
    "berry",
    "peach",
    "pineapple",
    "cranberry",
    "raspberry",
    "cherry",
    "passion",
    "puree",
  ],
  refreshing: [
    "soda",
    "tonic",
    "sparkling",
    "prosecco",
    "champagne",
    "ginger beer",
    "highball",
    "collins",
    "fizz",
    "mule",
    "mint",
  ],
  bold: ["stir", "old fashioned", "manhattan", "martini", "negroni"],
};

function recipeText(recipe: CocktailRecipe) {
  return [
    recipe.name,
    recipe.method,
    recipe.glass,
    recipe.garnish,
    ...recipe.ingredients.map((ingredient) => ingredient.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreRecipe(recipe: CocktailRecipe, flavor: FlavorId) {
  const text = recipeText(recipe);
  let score = flavorKeywords[flavor].reduce(
    (total, keyword) => total + (text.includes(keyword) ? 2 : 0),
    0,
  );

  if (flavor === "sour" && recipe.name.toLowerCase().includes("sour")) {
    score += 5;
  }

  if (flavor === "refreshing") {
    if (/lemon|lime|citrus|grapefruit/.test(text)) score += 2;
    if (/top up|fill up/.test(text)) score += 3;
  }

  if (flavor === "bold") {
    const hasMixer = /juice|soda|tonic|sparkling|cream|puree/.test(text);
    if (/\bstir|stirred\b/.test(recipe.method.toLowerCase())) score += 4;
    if (recipe.ingredients.length <= 4) score += 3;
    if (!hasMixer) score += 3;
  }

  return score;
}

export function selectClassicCocktail(
  input: CocktailEngineInput,
  random: () => number = Math.random,
): CocktailRecipe {
  const spiritCandidates = classicRecipes.filter(
    (recipe) => recipe.baseSpirit === input.spirit,
  );
  const safeCandidates =
    spiritCandidates.length > 0 ? spiritCandidates : classicRecipes;
  const ranked = safeCandidates
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, input.flavor) }))
    .sort((a, b) => b.score - a.score);
  const bestScore = ranked[0]?.score ?? 0;
  const topCandidates = ranked
    .filter((candidate) => candidate.score >= Math.max(bestScore - 1, 0))
    .slice(0, 5);
  const selectionPool = topCandidates.length > 0 ? topCandidates : ranked;
  const randomValue = random();
  const safeRandom = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 0.999999)
    : 0;
  const selectedIndex = Math.floor(safeRandom * selectionPool.length);

  return selectionPool[selectedIndex]?.recipe ?? classicRecipes[0]!;
}
