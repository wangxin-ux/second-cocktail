import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { Mbti, TonightEnergy } from "@/lib/second/profile";
import { ingredientPools, signatureNames } from "./ingredient-pools";
import type { CocktailIngredient, CocktailRecipe } from "./types";

export type LocalCreativeInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  energy?: TonightEnergy;
  mbti?: Mbti;
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
  gin: /\bgin\b|金酒/i,
  vodka: /\bvodka\b|伏特加/i,
  rum: /\b(rum|cachaça|cachaca|ron|aguardiente)\b|朗姆/i,
  tequila: /\b(tequila|mezcal)\b|龙舌兰|梅斯卡尔/i,
  whisky: /\b(whisky|whiskey|bourbon|rye|scotch)\b|威士忌|波本|黑麦/i,
  brandy: /\b(brandy|cognac|pisco|calvados|armagnac)\b|白兰地|干邑/i,
};

const ingredientMatchers = {
  citrus: /lemon|lime|grapefruit|citrus|yuzu|柠檬|青柠|葡萄柚|西柚|柚子/i,
  sweetener: /syrup|sugar|honey|agave|demerara|糖浆|糖|蜂蜜/i,
  fruit: /pineapple|passion|orange juice|cranberry|peach|raspberry|berry|fruit|puree|菠萝|百香果|橙汁|蔓越莓|桃|覆盆子|莓|果泥|果汁/i,
  liqueur: /liqueur|triple sec|curaçao|curacao|cointreau|maraschino|cr[eè]me|利口酒|君度|查特/i,
  bitters: /bitters|苦精/i,
  bitterModifier: /campari|aperol|amaro|vermouth|金巴利|味美思|苦艾/i,
  herb: /basil|mint|rosemary|cucumber|罗勒|薄荷|迷迭香|黄瓜/i,
  mixer: /soda|tonic|ginger beer|sparkling|苏打|汤力|姜汁啤酒|起泡酒|香槟|汽水|可乐/i,
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

function addOrReplaceCuriousHerb(
  draft: RecipeDraft,
  random: () => number,
) {
  if (addHerb()(draft, random)) return true;

  const herb = pickAvailable(ingredientPools.herbs, draft, random);
  if (!herb) return false;
  const replaceableAccent = draft.ingredients.findLastIndex(
    (ingredient) =>
      !isBaseIngredient(ingredient.name) &&
      !ingredientMatchers.mixer.test(ingredient.name) &&
      ingredient.amountText !== undefined,
  );
  if (replaceableAccent < 0) return false;
  draft.ingredients[replaceableAccent] = {
    name: herb,
    amountText: herbMeasures[herb],
  };
  return true;
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

function addMixer(draft: RecipeDraft, amountMl: number) {
  if (draft.ingredients.length >= 8) return false;
  if (draft.ingredients.some((ingredient) => ingredientMatchers.mixer.test(ingredient.name))) {
    return false;
  }
  draft.ingredients.push({ name: "Soda Water", amountMl });
  return true;
}

function increaseMixer(draft: RecipeDraft, amountMl: number) {
  const mixer = draft.ingredients.find(
    (ingredient) =>
      ingredientMatchers.mixer.test(ingredient.name) &&
      ingredient.amountMl !== undefined,
  );
  if (!mixer) return false;
  mixer.amountMl = Math.min(150, roundToFive(mixer.amountMl! + amountMl));
  return true;
}

function addNamedAccent(
  draft: RecipeDraft,
  ingredient: CocktailIngredient,
) {
  if (draft.ingredients.length >= 8 || hasIngredient(draft, ingredient.name)) {
    return false;
  }
  draft.ingredients.push(ingredient);
  return true;
}

function adjustNonBaseIngredient(
  draft: RecipeDraft,
  deltaMl: number,
) {
  const ingredient = draft.ingredients.find(
    (candidate) =>
      !isBaseIngredient(candidate.name) &&
      !ingredientMatchers.mixer.test(candidate.name) &&
      candidate.amountMl !== undefined &&
      candidate.amountMl > Math.abs(Math.min(deltaMl, 0)),
  );
  if (!ingredient) return false;
  ingredient.amountMl = Math.max(5, Math.min(150, ingredient.amountMl! + deltaMl));
  return true;
}

function softenStructure(draft: RecipeDraft, flavor: FlavorId) {
  const removableIndex = draft.ingredients.findLastIndex((ingredient) => {
    if (isBaseIngredient(ingredient.name)) return false;
    if (flavor === "refreshing" && ingredientMatchers.mixer.test(ingredient.name)) return false;
    if (flavor === "sour" && ingredientMatchers.citrus.test(ingredient.name)) return false;
    if (flavor === "bitter" && ingredientMatchers.bitterModifier.test(ingredient.name)) return false;
    return ingredientMatchers.bitters.test(ingredient.name) ||
      ingredientMatchers.herb.test(ingredient.name) ||
      ingredientMatchers.liqueur.test(ingredient.name);
  });

  if (draft.ingredients.length > 3 && removableIndex >= 0) {
    draft.ingredients.splice(removableIndex, 1);
    return true;
  }

  const sharpIngredient = draft.ingredients.find(
    (ingredient) =>
      (ingredientMatchers.citrus.test(ingredient.name) ||
        ingredientMatchers.bitterModifier.test(ingredient.name)) &&
      ingredient.amountMl !== undefined &&
      ingredient.amountMl > 10,
  );
  if (sharpIngredient) {
    sharpIngredient.amountMl = Math.max(5, sharpIngredient.amountMl! - 5);
    return true;
  }
  return adjustNonBaseIngredient(draft, -5);
}

function applyEnergyBias(
  draft: RecipeDraft,
  flavor: FlavorId,
  energy: TonightEnergy | undefined,
  random: () => number,
) {
  if (!energy) return;

  switch (energy) {
    case "open":
      if (increaseMixer(draft, 15)) return;
      if (flavor !== "bold" && addMixer(draft, 45)) return;
      if (addNamedAccent(draft, { name: "Orange Bitters", amountText: "1 dash" })) return;
      adjustNonBaseIngredient(draft, 5);
      return;
    case "curious":
      if (
        ["sour", "fruity", "refreshing"].includes(flavor) &&
        addOrReplaceCuriousHerb(draft, random)
      ) return;
      addNamedAccent(draft, { name: "Orange Bitters", amountText: "2 dashes" });
      return;
    case "slow":
      softenStructure(draft, flavor);
      return;
    case "celebrating":
      if (flavor !== "bold") {
        if (increaseMixer(draft, 30)) return;
        if (addMixer(draft, 75)) return;
      }
      if (addNamedAccent(draft, { name: "Angostura Bitters", amountText: "2 dashes" })) return;
      adjustNonBaseIngredient(draft, 10);
      return;
  }
}

function applyMbtiRefinement(
  draft: RecipeDraft,
  flavor: FlavorId,
  mbti: Mbti | undefined,
) {
  if (!mbti) return;

  if (mbti.startsWith("E")) {
    increaseMixer(draft, 10);
  } else if (mbti.startsWith("I")) {
    const mixer = draft.ingredients.find(
      (ingredient) =>
        ingredientMatchers.mixer.test(ingredient.name) &&
        ingredient.amountMl !== undefined &&
        ingredient.amountMl > 45,
    );
    if (mixer) mixer.amountMl = Math.max(45, mixer.amountMl! - 10);
  }

  if (mbti[1] === "N") {
    addNamedAccent(draft, { name: "Orange Bitters", amountText: "1 dash" });
  } else if (mbti[1] === "S" && flavor !== "refreshing") {
    draft.garnish = garnishPools[flavor][0];
  }
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
    /juice|puree|cream|egg|果汁|果泥|奶油|蛋白/i.test(ingredient.name),
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
  { spirit, flavor, energy, mbti, referenceRecipe }: LocalCreativeInput,
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
  draft.garnish = pick(garnishPools[flavor], random);
  applyEnergyBias(draft, flavor, energy, random);
  applyMbtiRefinement(draft, flavor, mbti);
  draft.ingredients = uniqueIngredients(draft.ingredients).slice(0, 8);

  const name = generateName(referenceRecipe.name, random);

  return {
    id: `local-${slugify(name)}`,
    name,
    ...draft,
    method: buildMethod(draft, flavor),
  };
}
