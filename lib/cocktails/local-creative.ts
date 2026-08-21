import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { ingredientPools, signatureNames } from "./ingredient-pools";
import type { CocktailIngredient, CocktailRecipe } from "./types";

export type LocalCreativeInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  referenceRecipe: CocktailRecipe;
};

type LocalCreativeOptions = {
  random?: () => number;
};

type RecipeDraft = Omit<CocktailRecipe, "id" | "name" | "method">;
type Change = (draft: RecipeDraft, random: () => number) => boolean;
type FlavorChangePlan = {
  primary: Change[];
  secondary: Change[];
};

const baseMatchers: Record<SpiritId, RegExp> = {
  gin: /\bgin\b/i,
  vodka: /\bvodka\b/i,
  rum: /\b(rum|cachaça|cachaca|ron|aguardiente)\b/i,
  tequila: /\b(tequila|mezcal)\b/i,
  whisky: /\b(whisky|whiskey|bourbon|rye|scotch)\b/i,
  brandy: /\b(brandy|cognac|pisco|calvados|armagnac)\b/i,
};

const ingredientMatchers = {
  citrus: /lemon|lime|grapefruit|citrus|yuzu/i,
  sweetener: /syrup|sugar|honey|agave|demerara/i,
  fruit: /pineapple|passion|orange juice|cranberry|peach|raspberry|berry|fruit|puree/i,
  liqueur: /liqueur|triple sec|curaçao|curacao|cointreau|maraschino|cr[eè]me/i,
  bitters: /bitters/i,
  bitterModifier: /campari|aperol|amaro|vermouth/i,
  herb: /basil|mint|rosemary|cucumber/i,
  mixer: /soda|tonic|ginger beer|sparkling/i,
};

const garnishPools: Record<FlavorId, readonly string[]> = {
  sour: ["Lemon twist", "Lime wheel"],
  sweet: ["Orange twist", "Grated nutmeg"],
  bitter: ["Orange twist", "Grapefruit peel"],
  fruity: ["Orange wheel", "Fresh raspberry"],
  refreshing: ["Mint sprig", "Cucumber ribbon", "Grapefruit twist"],
  bold: ["Orange peel", "Lemon twist"],
};

const herbMeasures: Record<(typeof ingredientPools.herbs)[number], string> = {
  Basil: "3 leaves",
  Mint: "6 leaves",
  Rosemary: "1 small sprig",
  Cucumber: "3 thin slices",
};

function safeRandom(random: () => number) {
  const value = random();
  return Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 0.999999)
    : 0;
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(safeRandom(random) * items.length)]!;
}

function shuffled<T>(items: readonly T[], random: () => number) {
  return [...items]
    .map((item) => ({ item, order: safeRandom(random) }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function roundToFive(amount: number) {
  return Math.max(5, Math.round(amount / 5) * 5);
}

function uniqueIngredients(ingredients: CocktailIngredient[]) {
  const names = new Set<string>();

  return ingredients.filter((ingredient) => {
    const name = ingredient.name.trim().toLowerCase();
    if (!name || names.has(name)) return false;
    names.add(name);
    return true;
  });
}

function normalizeReference(
  recipe: CocktailRecipe,
  spirit: SpiritId,
): RecipeDraft {
  const matcher = baseMatchers[spirit];
  const ingredients = uniqueIngredients(
    recipe.ingredients.map((ingredient) => ({ ...ingredient })),
  );
  let baseIngredients = ingredients.filter((ingredient) =>
    matcher.test(ingredient.name),
  );

  if (baseIngredients.length === 0) {
    baseIngredients = [{ name: spiritLabel(spirit), amountMl: 45 }];
    ingredients.unshift(baseIngredients[0]);
  }

  const knownBaseTotal = baseIngredients.reduce(
    (total, ingredient) => total + (ingredient.amountMl ?? 0),
    0,
  );

  if (knownBaseTotal <= 0) {
    baseIngredients[0]!.amountMl = 45;
    delete baseIngredients[0]!.amountText;
  } else if (knownBaseTotal > 60) {
    const scale = 60 / knownBaseTotal;
    for (const ingredient of baseIngredients) {
      ingredient.amountMl = roundToFive((ingredient.amountMl ?? 0) * scale);
      delete ingredient.amountText;
    }
    const roundedTotal = baseIngredients.reduce(
      (total, ingredient) => total + (ingredient.amountMl ?? 0),
      0,
    );
    const lastBase = baseIngredients.at(-1)!;
    lastBase.amountMl = Math.max(
      5,
      (lastBase.amountMl ?? 5) - (roundedTotal - 60),
    );
  } else if (knownBaseTotal < 30) {
    baseIngredients[0]!.amountMl = roundToFive(
      (baseIngredients[0]!.amountMl ?? 0) + (30 - knownBaseTotal),
    );
    delete baseIngredients[0]!.amountText;
  }

  const prioritized = [
    ...baseIngredients,
    ...ingredients.filter((ingredient) => !matcher.test(ingredient.name)),
  ].slice(0, 7);

  return {
    baseSpirit: spirit,
    ingredients: prioritized,
    glass: recipe.glass?.trim() || "Cocktail glass",
    garnish: recipe.garnish,
    source: recipe.source,
  };
}

function spiritLabel(spirit: SpiritId) {
  return spirit === "whisky"
    ? "Whisky"
    : `${spirit.charAt(0).toUpperCase()}${spirit.slice(1)}`;
}

function hasIngredient(draft: RecipeDraft, name: string) {
  return draft.ingredients.some(
    (ingredient) => ingredient.name.toLowerCase() === name.toLowerCase(),
  );
}

function isBaseIngredient(name: string) {
  return Object.values(baseMatchers).some((matcher) => matcher.test(name));
}

function pickAvailable<T extends string>(
  pool: readonly T[],
  draft: RecipeDraft,
  random: () => number,
): T | undefined {
  return shuffled(pool, random).find((name) => !hasIngredient(draft, name));
}

function replaceOrAdd(
  matcher: RegExp,
  pool: readonly string[],
  defaultAmountMl: number,
): Change {
  return (draft, random) => {
    const replacement = pickAvailable(pool, draft, random);
    if (!replacement) return false;

    const index = draft.ingredients.findIndex(
      (ingredient) =>
        !isBaseIngredient(ingredient.name) && matcher.test(ingredient.name),
    );
    const amountMl =
      index >= 0 && draft.ingredients[index]!.amountMl !== undefined
        ? roundToFive(draft.ingredients[index]!.amountMl!)
        : defaultAmountMl;
    const next = { name: replacement, amountMl };

    if (index >= 0) {
      draft.ingredients[index] = next;
      return true;
    }

    if (draft.ingredients.length >= 8) return false;
    draft.ingredients.push(next);
    return true;
  };
}

function addAccent(
  pool: readonly string[],
  amountText: string,
): Change {
  return (draft, random) => {
    if (draft.ingredients.length >= 8) return false;
    const ingredient = pickAvailable(pool, draft, random);
    if (!ingredient) return false;
    draft.ingredients.push({ name: ingredient, amountText });
    return true;
  };
}

function addHerb(): Change {
  return (draft, random) => {
    if (draft.ingredients.length >= 8) return false;
    const herb = pickAvailable(ingredientPools.herbs, draft, random);
    if (!herb) return false;
    draft.ingredients.push({ name: herb, amountText: herbMeasures[herb] });
    return true;
  };
}

function adjustIngredient(matcher: RegExp): Change {
  return (draft, random) => {
    const candidates = draft.ingredients.filter(
      (ingredient) =>
        matcher.test(ingredient.name) && ingredient.amountMl !== undefined,
    );
    if (candidates.length === 0) return false;

    const ingredient = pick(candidates, random);
    const direction = safeRandom(random) < 0.5 ? -1 : 1;
    const percentage = 0.1 + safeRandom(random) * 0.15;
    const adjusted = roundToFive(
      ingredient.amountMl! * (1 + direction * percentage),
    );
    if (adjusted === ingredient.amountMl) {
      ingredient.amountMl = Math.max(5, ingredient.amountMl! + direction * 5);
    } else {
      ingredient.amountMl = adjusted;
    }
    return true;
  };
}

function flavorChanges(flavor: FlavorId): FlavorChangePlan {
  const citrus = replaceOrAdd(
    ingredientMatchers.citrus,
    ingredientPools.citrus,
    20,
  );
  const sweetener = replaceOrAdd(
    ingredientMatchers.sweetener,
    ingredientPools.sweeteners,
    15,
  );
  const fruit = replaceOrAdd(
    ingredientMatchers.fruit,
    ingredientPools.fruit,
    30,
  );
  const liqueur = replaceOrAdd(
    ingredientMatchers.liqueur,
    ingredientPools.liqueurs,
    15,
  );
  const bitterModifier = replaceOrAdd(
    ingredientMatchers.bitterModifier,
    ingredientPools.bitterModifiers,
    15,
  );
  const mixer: Change = (draft, random) => {
    const hasCreamOrEgg = draft.ingredients.some((ingredient) =>
      /cream|egg/i.test(ingredient.name),
    );
    const compatibleMixers = hasCreamOrEgg
      ? (["Soda Water"] as const)
      : ingredientPools.longMixers;

    return replaceOrAdd(
      ingredientMatchers.mixer,
      compatibleMixers,
      75,
    )(draft, random);
  };
  const bitters = addAccent(ingredientPools.bitters, "2 dashes");
  const herb = addHerb();

  switch (flavor) {
    case "sour":
      return {
        primary: [citrus, sweetener],
        secondary: [sweetener, citrus, adjustIngredient(/juice|syrup/i)],
      };
    case "sweet":
      return {
        primary: [sweetener, liqueur],
        secondary: [fruit, liqueur, adjustIngredient(/syrup|liqueur/i)],
      };
    case "bitter":
      return {
        primary: [bitterModifier, bitters],
        secondary: [citrus, bitters, adjustIngredient(/vermouth|campari|aperol/i)],
      };
    case "fruity":
      return {
        primary: [fruit],
        secondary: [citrus, liqueur, sweetener],
      };
    case "refreshing":
      return {
        primary: [mixer],
        secondary: [citrus, herb, adjustIngredient(/juice|soda|tonic|ginger beer/i)],
      };
    case "bold":
      return {
        primary: [bitterModifier, bitters],
        secondary: [liqueur, bitters, adjustIngredient(/vermouth|liqueur/i)],
      };
  }
}

function ensureMinimumStructure(
  draft: RecipeDraft,
  flavor: FlavorId,
  random: () => number,
) {
  if (draft.ingredients.length >= 2) return;
  const pool = flavor === "bold" ? ingredientPools.bitterModifiers : ingredientPools.citrus;
  draft.ingredients.push({ name: pick(pool, random), amountMl: flavor === "bold" ? 15 : 20 });
}

function generateName(referenceName: string, random: () => number) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const name = `${pick(signatureNames.prefixes, random)} ${pick(signatureNames.suffixes, random)}`;
    if (name.toLowerCase() !== referenceName.toLowerCase()) return name;
  }
  return `Secret ${pick(signatureNames.suffixes, random)}`;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildMethod(recipe: RecipeDraft, flavor: FlavorId) {
  const mixer = recipe.ingredients.find((ingredient) =>
    ingredientMatchers.mixer.test(ingredient.name),
  );
  const hasJuice = recipe.ingredients.some((ingredient) =>
    /juice|puree|cream|egg/i.test(ingredient.name),
  );
  const muddleIngredient = recipe.ingredients.find((ingredient) =>
    /wedges|leaves|slices/i.test(ingredient.name),
  );
  const glass = recipe.glass ?? "cocktail glass";

  if (mixer) {
    return hasJuice
      ? `Shake all ingredients except ${mixer.name} with ice, strain into a ${glass} over fresh ice, then top with ${mixer.name}.`
      : `Build in a ${glass} over ice, stir briefly, then top with ${mixer.name}.`;
  }

  if (flavor === "bold" || (!hasJuice && flavor === "bitter")) {
    return `Stir with ice, then strain into a chilled ${glass}.`;
  }

  if (muddleIngredient) {
    return `Gently muddle ${muddleIngredient.name} in the ${glass}, add the remaining ingredients and ice, then stir.`;
  }

  return `Shake with ice, then strain into a chilled ${glass}.`;
}

export function createLocalSignatureCocktail(
  { spirit, flavor, referenceRecipe }: LocalCreativeInput,
  options: LocalCreativeOptions = {},
): CocktailRecipe {
  const random = options.random ?? Math.random;
  const draft = normalizeReference(referenceRecipe, spirit);
  const changePlan = flavorChanges(flavor);
  const targetChanges = 1 + Math.floor(safeRandom(random) * 3);
  let appliedChanges = 0;

  for (const change of shuffled(changePlan.primary, random)) {
    if (change(draft, random)) {
      appliedChanges += 1;
      break;
    }
  }

  for (const change of shuffled(changePlan.secondary, random)) {
    if (appliedChanges >= targetChanges) break;
    if (change(draft, random)) appliedChanges += 1;
  }

  ensureMinimumStructure(draft, flavor, random);
  draft.ingredients = uniqueIngredients(draft.ingredients).slice(0, 8);
  draft.garnish = pick(garnishPools[flavor], random);

  const name = generateName(referenceRecipe.name, random);

  return {
    id: `local-${slugify(name)}`,
    name,
    ...draft,
    method: buildMethod(draft, flavor),
  };
}
