import OpenAI from "openai";
import type { FlavorId } from "@/app/flavors/flavors";
import { getSpirit, type SpiritId } from "@/app/spirits/spirits";
import type { CocktailRecipe } from "./types";

type CreativeCocktailInput = {
  spirit: SpiritId;
  flavor: FlavorId;
  referenceRecipe: CocktailRecipe;
};

type AiCocktailDraft = {
  name: string;
  baseSpirit: SpiritId;
  ingredients: Array<{
    name: string;
    amountMl: number;
  }>;
  method: string;
  glass: string;
  garnish: string;
};

const flavorGuidance: Record<FlavorId, string> = {
  sour: "Bright and citrus-led, using a balanced sour structure.",
  sweet: "Smooth and indulgent, but balanced rather than cloying.",
  bitter: "Complex and grown-up, with measured bitter or aperitif elements.",
  fruity: "Juicy and aromatic, using real fruit, juice, puree, or liqueur.",
  refreshing: "Light and crisp, suitable for a longer or sparkling drink.",
  bold: "Spirit-forward and intense, with controlled dilution and modifiers.",
};

const signatureCocktailSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    baseSpirit: {
      type: "string",
      enum: ["gin", "vodka", "rum", "tequila", "whisky", "brandy"],
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amountMl: { type: "number" },
        },
        required: ["name", "amountMl"],
        additionalProperties: false,
      },
    },
    method: { type: "string" },
    glass: { type: "string" },
    garnish: { type: "string" },
  },
  required: [
    "name",
    "baseSpirit",
    "ingredients",
    "method",
    "glass",
    "garnish",
  ],
  additionalProperties: false,
} as const;

const creativeMixologistPrompt = `You are a professional Creative Mixologist.

Create one new signature cocktail by making a disciplined variation on the supplied classic reference cocktail. Do not invent a drink from nothing.

Rules:
- Keep the user's selected base spirit and flavor direction.
- Preserve the reference cocktail's overall structural logic and sensible proportions.
- Aim for roughly 70% classic structure and 30% creative interpretation; this is a creative constraint, not a calculation.
- The drink must be practical for a real bartender to make.
- Express every liquid ingredient in millilitres.
- Use only common, real bar ingredients. Never invent brands, spirits, liqueurs, or ingredients.
- Never include dangerous, inedible, medicinal, or extreme ingredients.
- Avoid extreme ratios and excessive total volume.
- Include 2 to 8 ingredients.
- Include at least 20 ml of the selected base-spirit family as a primary ingredient.
- Create an original cocktail name.

You may replace citrus or syrup, add a real liqueur, bitters, herbs, tea, fruit, soda, or tonic, adjust proportions moderately, and change the garnish.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAiDraft(value: unknown): AiCocktailDraft | undefined {
  if (!isRecord(value)) return undefined;
  const spirit =
    typeof value.baseSpirit === "string"
      ? getSpirit(value.baseSpirit)?.id
      : undefined;
  if (
    !spirit ||
    typeof value.name !== "string" ||
    typeof value.method !== "string" ||
    typeof value.glass !== "string" ||
    typeof value.garnish !== "string" ||
    !Array.isArray(value.ingredients)
  ) {
    return undefined;
  }

  const ingredients = value.ingredients.flatMap((ingredient) => {
    if (
      !isRecord(ingredient) ||
      typeof ingredient.name !== "string" ||
      typeof ingredient.amountMl !== "number"
    ) {
      return [];
    }
    return [{ name: ingredient.name, amountMl: ingredient.amountMl }];
  });

  if (ingredients.length !== value.ingredients.length) return undefined;

  return {
    name: value.name,
    baseSpirit: spirit,
    ingredients,
    method: value.method,
    glass: value.glass,
    garnish: value.garnish,
  };
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createSignatureCocktail({
  spirit,
  flavor,
  referenceRecipe,
}: CreativeCocktailInput): Promise<CocktailRecipe | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: "gpt-5-mini",
    instructions: creativeMixologistPrompt,
    input: JSON.stringify({
      userSelection: {
        baseSpirit: spirit,
        flavor,
        flavorDirection: flavorGuidance[flavor],
      },
      referenceCocktail: referenceRecipe,
    }),
    text: {
      format: {
        type: "json_schema",
        name: "signature_cocktail",
        description: "A practical signature cocktail recipe.",
        strict: true,
        schema: signatureCocktailSchema,
      },
    },
    max_output_tokens: 1200,
    store: false,
  });

  if (!response.output_text) return undefined;

  const draft = parseAiDraft(JSON.parse(response.output_text));
  if (!draft) return undefined;

  return {
    id: `ai-${slugify(draft.name)}`,
    name: draft.name.trim(),
    baseSpirit: draft.baseSpirit,
    ingredients: draft.ingredients.map((ingredient) => ({
      name: ingredient.name.trim(),
      amountMl: ingredient.amountMl,
    })),
    method: draft.method.trim(),
    glass: draft.glass.trim(),
    ...(draft.garnish.trim() ? { garnish: draft.garnish.trim() } : {}),
    source: "https://developers.openai.com/api/docs/guides/structured-outputs",
  };
}
