import type { SecondProfile } from "./profile";
import type { CocktailSignals, MatchCandidate } from "./match-types";

export type OpeningPrompt = { en: string; zh: string };

export function createOpeningPrompt(currentUserProfile: SecondProfile, candidate: MatchCandidate, cocktail: CocktailSignals): OpeningPrompt {
  if (cocktail.flavor === candidate.flavor) {
    return { en: "You chose the same flavor tonight. What does a good night look like to you?", zh: "你们今晚选了同一种风味。对你来说，一个好夜晚是什么样的？" };
  }
  if (currentUserProfile.energy && currentUserProfile.energy === candidate.energy) {
    return { en: "You came in with the same energy. What brought you out tonight?", zh: "你们带着相同的状态来到这里。今晚是什么让你出门了？" };
  }
  return { en: "Your drinks went in opposite directions. Which one would you steal a sip from?", zh: "你们的酒走向完全不同。你更想偷喝哪一杯？" };
}
