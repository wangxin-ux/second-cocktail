import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { CocktailGenerationResponse } from "./types";

export const cocktailSessionStorageKey = "second:cocktail-session:v1";
export const tonightSeedStorageKey = "second:tonight-seed:v1";

export type TonightCocktailSession = {
  spirit: SpiritId;
  flavor: FlavorId;
  profileKey: string;
  variation: number;
  result: CocktailGenerationResponse;
};

export function getTonightSeed() {
  if (typeof window === "undefined") return "second-server";
  const existing = window.sessionStorage.getItem(tonightSeedStorageKey);
  if (existing) return existing;

  const next = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(tonightSeedStorageKey, next);
  return next;
}

export function readTonightCocktailSession(): TonightCocktailSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(cocktailSessionStorageKey) ?? "null",
    ) as TonightCocktailSession | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.spirit !== "string" ||
      typeof parsed.flavor !== "string" ||
      typeof parsed.profileKey !== "string" ||
      typeof parsed.variation !== "number" ||
      !parsed.result?.recipe?.id ||
      !parsed.result.recipe.name
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeTonightCocktailSession(session: TonightCocktailSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    cocktailSessionStorageKey,
    JSON.stringify(session),
  );
}
