import rawIbaRecipes from "@/data/cocktails/iba-cocktails-web.json";
import {
  normalizeIbaRecipes,
  type RawIbaRecipe,
} from "./iba-adapter";

export const classicRecipes = normalizeIbaRecipes(
  rawIbaRecipes as RawIbaRecipe[],
);
